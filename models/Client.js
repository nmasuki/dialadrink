var keystone = require('keystone');
var cloudinary = require('cloudinary');
var webpush = require("web-push");
var fs = require('fs');

var fcm = new (require('fcm-node'))(process.env.FCM_KEY);
var sms = new (require("../helpers/movesms"))();

var Types = keystone.Field.Types;

var Client = new keystone.List('Client', {
    map: { name: 'firstName' },
    defaultSort: '-lastOrderDate',
    autokey: {
        path: 'key',
        unique: true,
        from: '_id'
    },
});

Client.add({
    phoneNumber: { type: String },
    email: { type: String },

    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String },

    city: { type: String, default: 'Nairobi' },
    address: { type: String },
    building: { type: String },
    houseNumber: { type: String },
    clientIps: { type: Types.TextArray, noedit: true },

    orderCount: { type: Number, noedit: true },
    orderValue: { type: Number, noedit: true },

    sessions: {
        type: Types.TextArray,
        noedit: true
    },

    image: { type: Types.CloudinaryImage, folder: "clients" },
    username: { type: String },
    password: { type: String, noedit: true },
    isPhoneVerified: {type: Boolean, noedit: true},

    tempPassword: { 
        pwd: { type: String }, 
        used: {type: Boolean, noedit: true},
		expiryDate: { type: Types.Datetime, default: Date.now }
    },

    deliverydays: {
        type: Types.TextArray,
        options: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        default: ["Thu", "Fri", "Sat", "Sun"]
    },

    registrationDate: {
        type: Types.Datetime,
        index: true,
        default: Date.now,
        noedit: true
    },

    createdDate: {
        type: Types.Datetime,
        index: true,
        default: Date.now,
        noedit: true
    },

    lastNotificationDate: {
        type: Types.Datetime,
        index: true,
        noedit: true
    },

    modifiedDate: {
        type: Types.Datetime,
        index: true,
        default: Date.now,
        noedit: true
    },

    lastOrderDate: {
        type: Types.Datetime,
        index: true,
        noedit: true
    },
    deliveryLocationMeta: { type: String }
});

Client.relationship({
    ref: 'Order',
    refPath: 'client'
});

Client.relationship({
    ref: 'ClientNotification',
    refPath: 'client'
});

Client.defaultColumns = 'firstName, lastName, phoneNumber, email, address, orderCount, orderValue, lastOrderDate';
Client.schema.virtual("isAppRegistered").get(function () {
    return !!this.password;
});

Client.schema.virtual("name")
    .get(function () {
        var name = ((this.firstName || '').trim() + ' ' + (this.lastName || '').trim());
        return name.trim().replace("  ", " ");
    });

Client.schema.virtual("name")
    .set(function (name) {
        var names = (name || "").split(' ');

        this.firstName = (names.slice(0, Math.max(1, names.length - 1)).join(' ') || "").trim();
        this.lastName = (names[names.length - 1] || "").trim();
    });

Client.schema.virtual("deliveryLocation")
    .get(function(){ return JSON.parse(this.deliveryLocationMeta || "{}"); });


Client.schema.virtual("deliveryLocation")
    .set(function(l){ this.deliveryLocationMeta = JSON.stringify(l || {}); });

Client.schema.methods.toAppObject = function () {
    var user = this;

    function getUniqueCode() {
        //var sep = ["-----", new Date().getTime(), "-----"].join('');
        var str = [user.phoneNumber, user.password, new Date().getTime()].join(':')
        return Buffer.from(str).toString('hex');
    }

    var imagePlaceHolder = this.gender && this.gender[0].toUpperCase() == "M" ?
        "https://www.cobdoglaps.sa.edu.au/wp-content/uploads/2017/11/placeholder-profile-sq.jpg" :
        "https://cdn1.vectorstock.com/i/thumb-large/46/55/person-gray-photo-placeholder-woman-vector-22964655.jpg";

    var cloudinaryOptions = {
        transformation: [{
            width: 200,
            height: 200,
            gravity: "face",
            radius: "max",
            crop: "thumb"
        }]
    };

    return {
        userid: user.id || '',
        user_name: user.name || '',
        username: user.username || (user.email || '').split('@')[0] || 'Guest',
        user_unique_code: getUniqueCode(),
        user_password: user.password || '',
        user_email: user.email || '',
        user_mobile: user.phoneNumber || '',
        user_state: user.city || '',
        user_city: user.city || '',
        user_country: user.country || '',
        user_address: user.address || '',
        user_directions: user.additional_directions || '',
        user_image: (user.image && user.image.secure_url && cloudinary.url(user.image.public_id, cloudinaryOptions)) || imagePlaceHolder,
        user_phone_verified: user.isPhoneVerified || '',
        user_reg_date: user.registrationDate || '',
        user_deliverydays: user.deliverydays || '',
        user_status: user.status || '',
        ips: user.clientIps || [],
        deliveryLocation: user.deliveryLocation
    };
};

Client.schema.methods.copyAppObject = function (obj) {
    if (!obj) return;
    var client = this;
    if (obj.userid)
        client.id = obj.userid;
    if (obj.username)
        client.username = client.username;
    if (obj.user_email)
        client.email = obj.user_email;
    if (obj.user_name)
        client.name = obj.user_name;
    if (obj.user_mobile)
        client.phoneNumber = obj.user_mobile;
    if (obj.user_address)
        client.address = obj.user_address;
    if (obj.user_state)
        client.city = obj.user_state;
    if (obj.user_city)
        client.city = obj.user_city;
    if (obj.user_country)
        client.country = obj.user_country;
    if (obj.user_additional_directions)
        client.additional_directions = (obj.user_directions || "Fri,Sat,Sun").split();
    if (obj.user_image)
        client.imageUrl = obj.user_image;
    if (obj.user_phone_verified)
        client.isPhoneVerified = obj.user_phone_verified;
    if (obj.user_reg_date)
        client.registrationDate = obj.user_reg_date;
    if (obj.user_status)
        client.status = obj.user_status;
    if (obj.user_deliverydays)
        client.deliverydays = obj.user_deliverydays;
    if (obj.deliveryLocation)
        client.deliveryLocation = obj.deliveryLocation;
};

Client.schema.methods.getSessions = function (next) {
    const db = keystone.mongoose.connection;
    var filter = {
        _id: {
            "$in": this.sessions
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

Client.schema.methods.sendNotification = function (title, body, icon, data) {
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
            if (client.lastNotificationDate < new Date().addDays(-15))
                return client.sendSMSNotification("DIALADRINK:Hey {firstName}. Install our app at http://bit.ly/2OZfVz1 and enjoy a faster, more customized experience!".format(client));
            
            return Promise.reject(`User ${client.name} has no push token associeted!`).catch(console.warn);
        }
    });
};

Client.schema.methods.sendSMSNotification = function (message) {
    var client = this;

    if (!message || !message.trim())
        return Promise.reject("SMS does not allow empty text");

    if (!client.phoneNumber || !client.phoneNumber.trim())
        return Promise.reject("SMS does not allow empty phoneNumber");

    message = message.replace(/<(?:.|\n)*?>/gm, '').format(client).trim();
    if(message.indexOf("http") < 0)
        message += " http://bit.ly/2TCl4MI";

    return sms.sendSMS([client.phoneNumber], message, function (err, res) {
        if (err)
            console.error.apply(client, arguments);
        else {
            client.lastNotificationDate = new Date();
            return client.save();
        }
    });
};

Client.schema.methods.sendEmailNotification = function (subject, body, locals = null, copyAdmins = true) {
    if (!body)
        throw "'template/body' is required!";
    if (!subject)
        throw "'subject' is required!";

    var client = this;
    var email;

    locals = Object.assign({
        layout: 'email',
        page: {
            title: keystone.get("name")
        },
        appUrl: keystone.get("url"),
        client: client,
    }, locals || {});

    if (fs.existsSync(`templates/email/${body}.hbs`))
        email = new keystone.Email(`templates/email/${body}`);
    else {
        email = new keystone.Email(`templates/email/content`);
        locals.content = body.format(client);
    }

    //Hack to make use of nodemailer..
    email.transport = require("../helpers/mailer");

    if (keystone.get("env") == "development")
        subject = "(Testing) " + subject;

    var emailOptions = {
        subject: subject,
        to: {
            name: client.firstName,
            email: client.email || "simonkimari@gmail.com"
        },
        cc: [],
        from: {
            name: keystone.get("name"),
            email: process.env.EMAIL_FROM
        }
    };

    if (!copyAdmins) {
        if (!emailOptions.cc.length) {
            if (keystone.get("env") == "production")
                emailOptions.cc.push("simonkimari@gmail.com");
            else
                emailOptions.cc.push(process.env.DEVELOPER_EMAIL);
        }

        console.log(
            "Sending Email notification!",
            "Client", client.email,
            "Admins", emailOptions.cc.map(u => u.email || u).join(',')
        );

        return new Promise((resolve, reject) => {
            email.send(locals, emailOptions, (err, a) => {
                if (err)
                    return reject(console.warn(err));

                console.log("Email notification Sent!");
                client.lastNotificationDate = new Date();
                resolve(a);
            });
        });
    } else {
        return keystone.list("Admin").model.find({
                receivesOrders: true
            })
            .exec((err, users) => {
                if (err)
                    return reject(console.log(err));

                if (users && users.length)
                    users.forEach(u => {
                        if (!emailOptions.to.email)
                            emailOptions.to.email = u.email;
                        if (emailOptions.to.email != u.email)
                            emailOptions.cc.push(u.toObject());
                    });
                else {
                    console.warn("No admin have the receivesOrders right!");
                    if (keystone.get("env") == "production")
                        emailOptions.cc.push("simonkimari@gmail.com");
                    else
                        emailOptions.cc.push(process.env.DEVELOPER_EMAIL);
                }

                console.log(
                    "Sending Email notification!",
                    "Client", client.email,
                    "Admins", emailOptions.cc.map(u => u.email || u).join(',')
                );

                return new Promise((resolve, reject) => {
                    email.send(locals, emailOptions, (err, a) => {
                        if (err)
                            return reject(err, console.error("Error sending email", err));

                        console.log("Email notification Sent!");
                        client.lastNotificationDate = new Date();
                        resolve(a);
                    });
                });
            });
    }
};

var updateOrderStats = function(client, next) {
    if (client.phoneNumber)
        client.phoneNumber = client.phoneNumber.cleanPhoneNumber();

    var findOption = {
        "$or": []
    };
    if (client.phoneNumber)
        findOption.$or.push({
            "delivery.phoneNumber": new RegExp(client.phoneNumber.substr(3))
        });

    if (client.email)
        findOption.$or.push({
            "delivery.email": new RegExp(client.email.escapeRegExp(), "i")
        });

    if (findOption.$or.length) {
        keystone.list("Order").model.find(findOption)
            .sort({
                orderDate: -1
            })
            .deepPopulate('cart.product.priceOptions.option')
            .exec((err, orders) => {
                if (err)
                    return next(err);

                if (client.orderCount && client.orderCount == orders.length)
                    next();

                client.orderCount = orders.length;
                client.orderValue = orders.sum(order => order.total);
                client.lastOrderDate = orders.max(order => order.orderDate);
                client.avgOrderValue = orders.avg(order => order.total);

                console.log("Saving client details!", client.name, client.orderCount, client.orderValue);
                next();
            });
    } else {
        console.error("This should never be hit!! Client has no phoneNumber or email.");
        next();
    }
};

Client.schema.pre('save', function (next) {
    var user = this;
    user.modifiedDate = Date.now();
    user.clientIps = this.clientIps.filter(ip => ip).distinct();

    if (user.imageUrl) {
        var opt =  { public_id: "users/" + user.name.cleanId() };
        cloudinary.v2.uploader.upload(user.imageUrl, opt, (err, res) => {
            user.image = res;
            updateOrderStats(user, next);
        });
    } else
        updateOrderStats(user, next);
});

Client.register();