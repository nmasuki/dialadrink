var keystone = require('keystone');
var Types = keystone.Field.Types;
var sms = require("../helpers/sms").getInstance();
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
            return this.accountStatus == "Active";
    }
    
    return false;
});

// authorization for http request
AppUser.schema.virtual("httpAuth")
    .get(function () {
        var str = [this.phoneNumber, this.password, new Date().getTime()].join(':');
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

// authorization for http request
AppUser.schema.virtual("fullName")
    .get(function () {
        return [this.name.first, this.name.last].filter(x => x).join(' ');
    });


AppUser.schema.set('toObject', {
    transform: function (doc, ret, options) {
        return ret;
    }
});

AppUser.schema.pre('save', function(next){
    var user = this;
    this.phoneNumber = (this.phoneNumber || "").cleanPhoneNumber();
    this.email = this.email.trim();
    
    if(!this.lsUser){
        this.lsUser = this.toAppObject();
        ls.save(this.lsUser);
    }

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
                sendSMS = user.accountStatus == "Active" && (!u.accountStatus || u.accountStatus == "Pending");              
            } else {
                sendSMS = user.accountStatus == "Active";
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
        used: true, resend: 0, expiry: new Date().addMinutes(5).getTime()
    };

    if(!user.password || sendOTP){
        if (!user.tempPassword.pwd || user.tempPassword.used || user.tempPassword.expiry >= Date.now()) {
            var charset = Array(11).join('x').split('').map((x, i) => String.fromCharCode(49 + i));
            if (alphaNumberic)
                charset = charset.concat(Array(27).join('x').split('').map((x, i) => String.fromCharCode(65 + i)));

            user.tempPassword.pwd = Array(alphaNumberic ? 8 : 5)
                .join('x').split('')
                .map(() => charset[Math.round(Math.random() * (charset.length - 1))])
                .join('');

            user.tempPassword.used = false;
            user.tempPassword.resend = 0;
            user.tempPassword.expiry = new Date().addMinutes(5).getTime();
        } else {
            user.tempPassword.resend += 1;
        }
        user.save();
    }

    var msg = "<#>DIALADRINK:" + (options.msg || `Your ${user.accountType} account has been created. `);
    if(!user.password || sendOTP)
        msg += `Use the Code ${user.tempPassword.pwd} to login. `;
    msg += `Download the app from https://bit.ly/2Xhk4Ts`;

    return sms.sendSMS(user.phoneNumber, msg + "\r\n" + (otpToken || process.env.APP_ID || ""));
};

AppUser.schema.methods.getSessions = function (next, sessions) {
    const db = keystone.mongoose.connection;
    var filter = {
        _id: {
            "$in": sessions || this.sessions || []
        }
    };

    var opt = keystone.get("session options");
    return new Promise((resolve, reject) => {
        db.collection('app_sessions')
            .find(filter).toArray((err, sessions) => {
                if (err)
                    reject(err);

                if (sessions)
                    sessions = sessions.map(s => {
                        var sess = JSON.parse(s.session || "{}");

                        sess._id = s._id;
                        if (opt && opt.cookie)
                            sess.startDate = s.expires.addSeconds(opt.cookie.maxAge / 1000);

                        return sess;
                    });

                if (!err)
                    resolve(sessions);
                if (typeof next == "function")
                    next(err, sessions);
            });
    });
};

AppUser.schema.methods.sendNotification = function (title, body, data, icon, sessions) {
    var client = this;
    return client.getSessions((err, sessions) => {
        if (err || !sessions)
            return Promise.reject("Error getting sessions!");

        if (data && data.sessionId)
            sessions = sessions.filter(s => (s.webpush || s.fcm) && s._id == data.sessionId);

        var webpushTokens = sessions.map(s => s.webpush).filter(t => !!t && t.endpoint);
        var fcmTokens = sessions.map(s => s.fcm).filter(t => !!t);

        if (webpushTokens.length || fcmTokens.length) {
            console.log(`Sending notifications to ${client.name}`);

            //Send WebPush
            var promises = webpushTokens.map(subscription => {
                var payload = {
                    title: title.format(client),
                    body: body.format(client).replace(/<(?:.|\n)*?>/gm, ''),
                    buttons: data && data.buttons,
                    icon: icon,
                    data: data
                };

                return webpush.sendNotification(subscription, JSON.stringify(payload))
                    .then(res => {
                        console.log(`Notification sent to ${client.name}`, payload.title, payload.body);
                        client.lastNotificationDate = new Date();
                        return client;
                    });
            });

            //Send FCM Push
            promises = promises.concat(fcmTokens.map(token => {
                var payload = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                    to: token,
                    //collapse_key: 'your_collapse_key',
                    notification: {
                        title: title.format(client),
                        body: body.format(client).replace(/<(?:.|\n)*?>/gm, '')
                    },
                    data: data
                };

                return new Promise((resolve, reject) => fcm.send(payload, function (err, response) {
                    if (err) {
                        console.error("Error sendin FCM!", err);
                        reject(err);
                    } else {
                        console.log("FCM successfully sent with response: ", response);
                        client.lastNotificationDate = new Date();
                        resolve(client);
                    }
                }));
            }));

            console.log(`Sessions: ${sessions.length}, WebTokens:${webpushTokens.length}, FCMTokens:${fcmTokens.length}`);
            return Promise.any(promises)
                .then(c => {
                    if(c && typeof c.save == "function")
                        c.save();
                    else if (c && c[0] && typeof c[0].save == "function")
                        c[0].save();
                    else
                        console.log(c);
                })
                .catch(console.error);
                
        } else {
            //TODO: NO webpush/fcm tokens to push to. Consider using sms/email
            //if (client.lastNotificationDate < new Date().addDays(-30))
            //    return client.sendSMSNotification("DIALADRINK:Hey {firstName}. Install our app at http://bit.ly/2OZfVz1 and enjoy a faster, more customized experience!".format(client));
            
            return Promise.resolve(`User ${client.name} has no push token associeted!`).then(console.warn);
        }
    }, sessions);
};

var ls = require("../helpers/LocalStorage").getInstance("appuser");

AppUser.find = function(filter){
    var Client = keystone.list("Client");
    return new Promise((resolve, reject) => {
        Client.model.find(filter).exec((err, clients) => {
            AppUser.model.find(filter).exec((err, users) => {
                if(err || !users){
                    console.log("Error!", err || "No user found");
                    users = [];
                }

                var appUsers = ls.getAll(filter);
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
                        if(users[i].password && (!user.passwords || user.passwords.contains(users[i].password)))
                            (user.passwords || (user.passwords = [])).push(users[i].password);

                        Object.assign(user, users[i]);
                    } else {
                        users[i].passwords = [] || users[i].passwords;
                        if(users[i].password)
                            users[i].passwords.push(users[i].password);
                        finalUsers.push(users[i]);
                    }
                }
                
                resolve(finalUsers.distinctBy(u => (u.phoneNumber || "").cleanPhoneNumber()));
            });
        });        
    });    
};

AppUser.findOne = function(filter){
    return AppUser.find(filter).then(users => users && users[0] || null);
};

AppUser.save = function(user){
    return new Promise((resolve, reject) => {
        var filter = { $or: [] };
        var id = null;
        
        if(user._id){
            id = user._id.toString();
            if(id.contains("-"))
                id = id.substr(id.indexOf("-") + 1);
        }
        
        if(id && id.length == 24)
            filter.$or.push({_id: id});
        
        if(user.phoneNumber){
            filter.$or.push({phoneNumber: user.phoneNumber});
            filter.$or.push({phoneNumber: user.phoneNumber.cleanPhoneNumber()});
        }

        if(user.email)
            filter.$or.push({email: user.email});

        if(!filter.$or.length)
            filter.$or.push({none_existing: 1});
        
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
                u.save((err) => {
                    if(err) 
                        reject(err);
                    else {
                        user._id = u._id.toString();
                        ls.save(user); 
                        resolve(u);
                    }
                });
            });
    });
};

/**
 * Registration
 */
AppUser.defaultColumns = 'name, phoneNumber, email, accountType, accountStatus, receivesOrders';
AppUser.register();
