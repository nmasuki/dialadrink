var keystone = require('keystone');
var Types = keystone.Field.Types;
var sms = new (require("../helpers/sms/MoveSMS"))();
var AppUser = new keystone.List('AppUser');

AppUser.add({
    name: {
        type: Types.Name,
        required: true,
        index: true
    },
    phoneNumber: {
        type: Types.Text,
        initial: true,
        required: true,
        index: true
    },
    email: {
        type: Types.Email,
        initial: true,
        required: true,
        index: true
    },
    password: {
        type: Types.Password,
        initial: true,
        required: true
    },
}, 'Permissions', {
    accountStatus: {
        type: Types.Select,
        options: 'Pending,Active,Deactivated',
        default: 'Pending',
        index: true
    },

    accountType: { 
        type: Types.Select,
        isMulti: true,
        options: 'rider,accounts office,sales office,office admin,system admin'
    },
    
    receivesOrders: {
        type: Boolean,
        label: 'Receive Orders',
        default: false,
        index: true
    }
});


/**
 * Relationships
 */
AppUser.relationship({
    ref: 'Blog',
    path: 'blogs',
    refPath: 'author'
});


// Provide access to Keystone
AppUser.schema.virtual('canAccessKeystone').get(function () {
    var allowedAccountTypes = ["system admin", "office admin"];

    for (var i in allowedAccountTypes) {
        var a = allowedAccountTypes[i];
        if (this.accountType == a)
            return this.accountStatus == "Approved";
    }
    
    return false;
});

// authorization for http request
AppUser.schema.virtual("httpAuth")
    .get(function () {
        var str = [user.phoneNumber, user.password, new Date().getTime()].join(':')
        return Buffer.from(str).toString('hex');
    });

// authorization for http request
AppUser.schema.virtual("firstName")
    .get(function () {
        return this.name.first;
    });
// authorization for http request
AppUser.schema.virtual("lastName")
    .get(function () {
        return this.name.last;
    });


AppUser.schema.set('toObject', {
    transform: function (doc, ret, options) {
        return ret;
    }
});

AppUser.schema.pre('save', function(next){
    var user = this;
    this.phoneNumber = (this.phoneNumber || "").cleanPhoneNumber();
    
    if(!this.lsUser)
        ls.save(this.toAppObject());

    var filter = { $or: [{_id: user._id}] };
    if(user.phoneNumber){
        filter.$or.push({phoneNumber: user.phoneNumber});
        filter.$or.push({phoneNumber: user.phoneNumber.cleanPhoneNumber()});
    }

    if(user.email)
        filter.$or.push({email: user.email});    

    AppUser.model.findOne(filter)
        .exec((err, u) => {
            if(err)
                console.error(err);

            var sendSMS = false;
            if(u){
                sendSMS = user.accountStatus == "Approved" && (!u.accountStatus || u.accountStatus == "Pending");              
            } else {
                sendSMS = user.accountStatus == "Approved";
            }
            
            if(sendSMS)
                user.sendNewAccountSMS({alphaNumberic: true});

            next();
        });
});

AppUser.schema.methods.toAppObject = function(){
    var obj = this.toObject();
    obj.firstName = this.name.first;
    obj.lastName = this.name.last;
    return obj;
};

AppUser.schema.methods.sendNewAccountSMS = function (options) {
    options = options || {};
    var user = this, 
        sendOTP = options.sendOTP,
        otpToken = options.token, 
        alphaNumberic = options.alphaNumberic;

    user.tempPassword = user.tempPassword || {
        used: true,
        resend: 0,
        expiry: new Date().addMinutes(5).getTime()
    };

    if(!user.password || sendOTP){
        if (!user.tempPassword.password || user.tempPassword.used || user.tempPassword.expiry >= Date.now()) {
            var charset = Array(11).join('x').split('').map((x, i) => String.fromCharCode(49 + i));
            if (alphaNumberic)
                charset = charset.concat(Array(27).join('x').split('').map((x, i) => String.fromCharCode(65 + i)));

            user.tempPassword.password = Array(alphaNumberic ? 7 : 5)
                .join('x').split('')
                .map(() => charset[Math.round(Math.random() * (charset.length - 1))])
                .join('');

            user.tempPassword.used = false;
            user.tempPassword.expiry = new Date().addMinutes(5).getTime();
        } else {
            user.tempPassword.resend += 1;
        }
        user.save();
    }

    var msg = "<#>DIALADRINK:" + (options.msg || `Your ${user.accountType} account has been Approved.`);
    if(!user.password || sendOTP)
        msg += `Use the Code ${user.tempPassword.password} to login.`;
    msg += `Download the app from https://bit.ly/2Xhk4Ts`;

    return sms.sendSMS(user.phoneNumber, msg + "\r\n" + (otpToken || process.env.APP_ID || ""));
};


var ls = require("../helpers/LocalStorage").getInstance("appuser");

function toFilterFn(obj){
    return function(a){
        var matched = !!a;
        if(a) for(var i in obj){
            if(obj.hasOwnProperty(i)){
                switch(i){
                    case "$not":
                        matched = matched && !toFilterFn(obj[i])(a);
                        break;
                    case "$or":
                        if(!Array.isArray(obj[i]))
                           throw "Expecting an array at " + i;
                        
                        matched = matched &&  Array.from(obj[i]).some(x => toFilterFn(x)(a));
                        break;
                    case "$and":
                        if(!Array.isArray(obj[i]))
                            throw "Expecting an array at " + i;

                        
                        matched = matched &&  Array.from(obj[i]).every(x => toFilterFn(x)(a));
                        break;
                    case "$elemMatch":
                        if(Array.isArray(a))
                            throw "Expecting an array to evaluate $elemMatch!";
                        
                        matched = matched && Array.from(a).some(x => toFilterFn(x)(obj[i]));
                        break;
                    case "$gt":
                        matched = matched && a > obj[i];
                        break;
                    case "$gte":
                        matched = matched && a >= obj[i];
                        break;
                    case "$lt":
                        matched = matched && a < obj[i];
                        break;
                    case "$lte":
                        matched = matched && a <= obj[i];
                        break;
                    case "$ne":
                        if(obj[i] instanceof RegExp)
                            matched = matched && !obj[i].test(a);
                        else
                            matched = matched && a != obj[i];
                        break;
                    case "$eq":
                        if(obj[i] instanceof RegExp)
                            matched = matched && obj[i].test(a);
                        else
                            matched = matched && a == obj[i];
                        break;
                    default:
                        if(obj[i] instanceof RegExp)
                            matched = matched && obj[i].test(a[i]);
                        else
                            matched = matched && a[i] == obj[i];
                }
            }            
        }
        return matched;
    };
}

AppUser.find = function(filter){
    var Client = keystone.list("Client");
    return new Promise((resolve, reject) => {
        Client.model.find(filter).exec((err, clients) => {
            AppUser.model.find(filter).exec((err, users) => {
                if(err)
                    console.log("Error!", err);
        
                var appUsers = ls.getAll().filter(toFilterFn(filter));
                /*
                console.log(JSON.stringify(filter), "\nMerging: " + 
                    clients.length + " clients,",
                    users.length + " AppUsers (mongo),",
                    appUsers.length + " AppUsers (file store)");
                /** */

                users = (clients || []).map(u => u.toAppObject && u.toAppObject() || u.toObject())
                    .concat((users || []).map(u => u.toAppObject && u.toAppObject() || u.toObject()))
                    .concat(appUsers);
    
                var finalUsers = [];                
                for(var i = 0; i < users.length; i++){
                    var user = finalUsers.find(u => u.phoneNumber && users[i].phoneNumber && u.phoneNumber.cleanPhoneNumber() == users[i].phoneNumber.cleanPhoneNumber());
                    if(user){
                        if(users[i].password && !user.passwords.contains(users[i].password))
                            user.passwords.push(users[i].password);
                        Object.assign(user, users[i]);
                    } else {
                        users[i].passwords = [];
                        if(users[i].password)
                            users[i].passwords.push(users[i].password);
                        finalUsers.push(users[i]);
                    }
                }
                
                resolve(finalUsers);
            });
        });
        
    });    
};

AppUser.findOne = function(filter){
    return AppUser.find(filter).then(users => users && users[0]);
};

AppUser.save = function(user){
    return new Promise((resolve, reject) => {
        var filter = { $or: [{_id: user._id}] };

        if(user.phoneNumber){
            filter.$or.push({phoneNumber: user.phoneNumber});
            filter.$or.push({phoneNumber: user.phoneNumber.cleanPhoneNumber()});
        }

        if(user.email)
            filter.$or.push({email: user.email});
        
        AppUser.model.findOne(filter)
            .exec((err, u) => {
                if(err)
                    return console.error(err);

                if(u){
                    for(var i in user){
                        if(user.hasOwnProperty(i) && user[i] !== undefined && !/^password$/.test(i)){
                            u[i] = user[i];
                        }
                    }
                } else {
                    u = new AppUser.model(user);
                }

                u.lsUser = user;
                ls.save(user);                
                u.save((err) => {
                    if(err) 
                        reject(err);
                    else
                        resolve(u);
                });
            });
    });
};

/**
 * Registration
 */
AppUser.defaultColumns = 'name, phoneNumber, email, accountType, accountStatus, receivesOrders';
AppUser.register();
