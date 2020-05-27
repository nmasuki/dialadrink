var keystone = require('keystone');
var Types = keystone.Field.Types;
//var Select = require("../helpers/customTypes/select/SelectType");

/**
 * AppUser Model
 * ==========
 */
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
            return true;
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
    this.phoneNumber = (this.phoneNumber || "").cleanPhoneNumber();
    next();
});

var ls = require("../helpers/LocalStorage").getInstance("appuser");

function toFilterFn(obj){
    return function(a){
        if(a) for(var i in obj){
            if(obj.hasOwnProperty(i)){
                switch(i){
                    case "$or":
                        if(Array.isArray(obj[i]))
                            return Array.from(obj[i]).some(x => toFilterFn(x)(a));
                        else
                            throw "Expecting an array at " + i;
                        break;
                    case "$and":
                        if(Array.isArray(obj[i]))
                            return Array.from(obj[i]).all(x => toFilterFn(x)(a));
                        else
                            throw "Expecting an array at " + i;
                        break;
                    case "$gt":
                        return a > obj[i];
                    case "$gte":
                        return a >= obj[i];
                    case "$lt":
                        return a < obj[i];
                    case "$lte":
                        return a <= obj[i];
                    case "$eq":
                        return a == obj[i];
                    default:
                        return a[i] == obj[i];
                }
            }
                return true;
        }
        return false;
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
                users = (clients || []).map(u => u.toAppObject && u.toAppObject() || u.toObject())
                    .concat((users || []).map(u => u.toAppObject && u.toAppObject() || u.toObject()))
                    .concat(appUsers);
    
                var finalUsers = [];                
                for(var i = 0; i < users.length; i++){
                    var user = finalUsers.find(u => u.phoneNumber && users[i].phoneNumber && u.phoneNumber.cleanPhoneNumber() == users[i].phoneNumber.cleanPhoneNumber());
                    if(user){
                        if(!user.passwords.contains(users[i].password))
                            user.passwords.push(users[i].password);
                        Object.assign(user, users[i]);
                    } else {
                        users[i].passwords = [users[i].password];
                        finalUsers.push(users[i]);
                    }
                }
                
                resolve(finalUsers);
            });
        });
        
    });    
};

AppUser.save = function(user){
    return new Promise((resolve, reject) => {
        AppUser.model.findOne({_id: user._id})
            .exec((err, u) => {
                if(err)
                    console.error(err);

                if(u){
                    for(var i in user)
                        if(user.hasOwnProperty(i))
                            u[i] = user[i];
                }else{
                    u = new AppUser.model(user);
                }

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
