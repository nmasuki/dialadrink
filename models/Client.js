var keystone = require('keystone');
var cloudinary = require('cloudinary');
var webpush = require("web-push");
var fs = require('fs');
var path = require('path');

var fcm = new (require('fcm-node'))(process.env.FCM_KEY);
var sms = require("../helpers/sms").getInstance();
var fileStore = require("../helpers/LocalStorage").getInstance("app-uploads");   

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

    orderCount: { type: Number, index: true, noedit: true },
    orderValue: { type: Number, index: true, noedit: true },
    avgOrderValue: { type: Number, index: true, noedit: true },
    lastOrderDate: {type: Types.Datetime, index: true, noedit: true },

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
        used: {type: Boolean },
        expiry: { type: Number, default: Date.now() },
        resend: { type: Number, noedit: true, default: 0 },
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

    lastOrderDate: {type: Types.Datetime, index: true, noedit: true },
    deliveryLocationMeta: { type: String },
    metaDataJSON: { type: String }
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

Client.schema.virtual("favouriteDrink")
    .get(async function () {
        var drinks = await this.getFavouriteDrinks(1);
        if(drinks && drinks.length)
            return drink[0].name;

        return "your favourite drink";
    });

Client.schema.virtual("favouriteBrand")
    .get(async function () {
        var drinks = await this.getFavouriteDrinks(100);
        var brands = drinks.groupBy(d => d.brand && d.brand.name || "");
        delete brands[""];

        var favourite = Object.values(brands).orderByDescending(g => g.length)[0][0];


        if(favourite)
            return favourite.name;
            
        return "your favourite brand";
    });

Client.schema.virtual("name")
    .get(function () {
        var name = ((this.firstName || '').trim() + ' ' + (this.lastName || '').trim());
        return name.trim().replace("/( ){2,}", " ");
    });

Client.schema.virtual("name")
    .set(function (name) {
        var names = (name || "").split(' ');

        this.firstName = (names.slice(0, Math.max(1, names.length - 1)).join(' ') || "").trim();
        this.lastName = (names[names.length - 1] || "").trim();
    });

Client.schema.virtual("metaData")
    .get(function () {
        if (!this._metaDataJSON)
            this._metaDataJSON = JSON.parse(this.metaDataJSON || "{}");
        return this._metaDataJSON;
    });


Client.schema.virtual("metaData")
    .set(function (value) { this._metaDataJSON = value || {}; });


Client.schema.virtual("deliveryLocation")
    .get(function(){ return JSON.parse(this.deliveryLocationMeta || "{}"); });


Client.schema.virtual("deliveryLocation")
    .set(function (l) {
        this.deliveryLocationMeta = JSON.stringify(l || {});
    });

Client.schema.virtual("imageUrl")
    .get(function () {
        var client = this;
        var gender = client.gender || client.guessGender(client.name).getGender() || "M";        
        
        var imagePlaceHolder = gender[0].toUpperCase() == "F"?
            "https://res.cloudinary.com/nmasuki/image/upload/w_200,c_fill,ar_1:1,g_auto,r_max/v1599750746/female-placeholder.jpg":
            "https://res.cloudinary.com/nmasuki/image/upload/w_200,c_fill,ar_1:1,g_auto,r_max/v1599750746/male-placeholder.jpg";

        var cloudinaryOptions = {
            secure: true,
            transformation: [{
                width: 200,
                height: 200,
                gravity: "face",
                radius: "max",
                crop: "thumb"
            }]
        };

        if(client.image && client.image.secure_url)
            return cloudinary.url(client.image.public_id, cloudinaryOptions);
        
        return imagePlaceHolder;
    });

Client.schema.virtual("imageUrl")
    .set(function (imageUrl) {
        var client = this;

        if(imageUrl && typeof imageUrl == "string"){
            var public_id = imageUrl.replace(/^https?:\/\/(((?!v)[^\/]+\/){4,5})(v[^\/]+\/)/, "").replace(/.(jpe?g|png)$/, "");
            var pidReg = new RegExp(public_id + "$");

            var file = fileStore.getOne({
                $or:[
                    { url: imageUrl },
                    { secure_url: imageUrl },
                    { public_id: public_id },
                    { public_id: pidReg }
                ]
            });
    
            if(file)   
                client.image = file;
            else {
                if(client.image && client.image.url && pidReg.test(client.image.url)){
                    console.log(`URLs match:
                        ${client.image.secure_url}
                        ${imageUrl}`
                    );
                    return;
                }

                var opt =  { public_id: "users/" + client.name.cleanId() };
                cloudinary.v2.uploader.upload(imageUrl, opt, (err, res) => {
                    if(err || !res)
                        return console(`Error uploading ${imageUrl}\n${err || "Upload gave no response!"}`)
                    client.image = res;
                });
            }
        }
});

Client.schema.virtual("httpAuth")
    .get(function () {
        var client = this;
        var str = [client.phoneNumber, client.password, new Date().getTime()].join(':');
        return Buffer.from(str).toString('hex');
    });

Client.schema.methods.toAppObject = function (appVersion) {
    var client = this;
    var ret = null; 

    if (appVersion || global.appVersion) {
        ret = Object.assign({ 
            userid: client.id,
            username: client.username || (client.email || '').split('@')[0]
        }, client.toObject());

        var allowed = ["name", "httpAuth", "imageUrl", "deliveryLocation", "isAppRegistered"];
        allowed.forEach(a => ret[a] = client[a]);
    }else{
        ret = {
            userid: client.id || '',
            user_name: client.name || '',
            username: client.username || (client.email || '').split('@')[0],
            user_unique_code: client.httpAuth,
            user_password: client.password || '',
            user_email: client.email || '',
            user_mobile: client.phoneNumber || '',
            user_state: client.city || '',
            user_city: client.city || '',
            user_country: client.country || '',
            user_address: client.address || '',
            user_directions: client.additional_directions || '',
            user_image: client.imageUrl,
            user_phone_verified: client.isPhoneVerified || '',
            user_reg_date: client.registrationDate || '',
            user_deliverydays: client.deliverydays || '',
            user_status: client.status || '',
            ips: client.clientIps || [],
            deliveryLocation: client.deliveryLocation
        };
    }

    if (!global.appUser || global.appUser._id != client.id) {
        var toDel = [
            "image", "tempPassword", 
            "httpAuth", //"password", 
            "user_unique_code", "user_password", 
            "metaDataJSON", "key", "sessions"
        ];
        toDel.forEach(x => delete ret[x]);
    }

    ret._rev = client.__v;
    delete ret.sessions;
    delete ret.image;
    delete ret.clientIps;
    delete ret.deliveryLocationMeta;
    
    return ret;
};

Client.schema.methods.copyAppObject = function (obj) {
    if (!obj) return;
    var client = this;

    var mapping = {
        "userid": "id",
        "mobile": "phoneNumber",
        "image": "imageUrl",
        "reg_date": "registrationDate",

        "user_mobile": "phoneNumber",
        "user_image": "imageUrl",
        "user_reg_date": "registrationDate"
    };

    for(var i in obj){
        if (!mapping[i]  && obj.hasOwnProperty(i))
            mapping[i] = i.replace(/^user\_/, "");        
    }

    for(var j in mapping){
        if (obj.hasOwnProperty(j))
            client[mapping[j]] = obj[j];
    }
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
            //if (client.lastNotificationDate < new Date().addDays(-30))
            //    return client.sendSMSNotification("DIALADRINK:Hey {firstName}. Install our app at http://bit.ly/2OZfVz1 and enjoy a faster, more customized experience!".format(client));
            
            return Promise.resolve(`User ${client.name} has no push token associeted!`).then(console.warn);
        }
    });
};

Client.schema.methods.sendSMSNotification = function (message) {
    var client = this;

    if (!message || !message.trim())
        return Promise.reject("SMS does not allow empty text!");
    else {
        message = message.replace(/<(?:.|\n)*?>/gm, '').format(client).trim();
        if(message.indexOf("http") < 0)
            message += " http://bit.ly/2TCl4MI";
    }

    if (!client.phoneNumber || !client.phoneNumber.trim())
        return Promise.reject("SMS does not allow empty phoneNumber!");

    if (!client.firstName && !client.lastName)
        return Promise.reject(`SMS does not allow empty names! ${client.phoneNumber}: ${message}`);

    return sms.sendSMS([client.phoneNumber], message, function (err, res) {
        if (!err)
            client.lastNotificationDate = new Date();        
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

    if (process.env.NODE_ENV == "development")
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
            if (process.env.NODE_ENV == "production")
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
        return keystone.list("AppUser").model.find({ receivesOrders: true })
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
                    if (process.env.NODE_ENV == "production")
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

Client.schema.methods.sendOTP = function (otpToken, alphaNumberic) {
    var client = this;
    client.tempPassword = client.tempPassword || {
        used: true,
        resend: 0,
        expiry: new Date().addMinutes(5).getTime()
    };

    if (!client.tempPassword.pwd || client.tempPassword.used || client.tempPassword.expiry >= Date.now()) {
        var charset = Array(11).join('x').split('').map((x, i) => String.fromCharCode(48 + i));
        if (alphaNumberic)
            charset = charset.concat(Array(27).join('x').split('').map((x, i) => String.fromCharCode(65 + i)));

        client.tempPassword.pwd = Array(alphaNumberic ? 7 : 5)
            .join('x').split('')
            .map((x) => charset[Math.round(Math.random() * (charset.length - 1))])
            .join('');

        client.tempPassword.used = false;
        client.tempPassword.resend = 0;
        client.tempPassword.expiry = new Date().addMinutes(5).getTime();
    } else {
        client.tempPassword.resend += 1;
    }

    return new Promise((resolve, reject) => {
        client.update(err => {
            if(err){
                console.error(err);
                return reject(err);
            }

            var msg = `<#>Your temporary password is ${client.tempPassword.pwd}\r\n${otpToken || process.env.APP_ID || ""}`;   
            console.log("OTP to:" + client.phoneNumber, msg); 
        
            sms.sendSMS(client.phoneNumber, msg).then(resolve);
        });
    });
};

var genderList = null;
Client.schema.methods.guessGender = function(name){
    if(!name) return { getGender: () => null };
      
    var filename = path.resolve("../", "data", "name_gender.csv");
    if (!genderList && fs.existsSync(filename)) {
        var guessGenderCSV = (fs.readFileSync(filename) || "{}").toString();
        if (guessGenderCSV) {
            genderList = guessGenderCSV.split('\n').filter(l => l).map(l => {
                var parts = l.split(',');
                return {
                    id: (parts[0] || "").cleanId(),
                    name: (parts[0]),
                    gender: parts[1],
                    probability: parseFloat(parts[2])
                };
            }).orderBy(x => -x.probability);
        }
    }

    var ids = (name || "").split(' ').map(n => n.cleanId());
    var matches = (genderList || []).filter(x => ids.indexOf(x.id) >= 0);

    if (matches.length) {
        var sum = matches.sum(x => x.probability);
        var ret = {
            name: name,
            male: (matches.filter(x => x.gender == "M").sum(x => x.probability) || 0) / sum,
            female: (matches.filter(x => x.gender == "F").sum(x => x.probability) || 0) / sum,
            getGender: () => {
                var diff = Math.abs(ret.male - ret.female);                   
                if (diff > 0.2)
                    return ret.male > ret.female ? "MALE" : "FEMALE";
                else
                    console.log(name, Math.round(100 * ret.male) + "% male, ", Math.round(100 * ret.female) + "% female");
            }
        };
        return ret;
    }

    return { getGender: () => null };
};

Client.schema.post('save', function(error, doc, next) {
    console.log(error);
    next();
});

Client.schema.pre('save', function (next) {
    var client = this;
    if (client.modifiedDate.addSeconds(10) > new Date()){
        var error = new Error("Client saved less than 10 sec ago. Should skip save but....");
        return next(error.message);
    }

    client.modifiedDate = new Date();
    client.clientIps = this.clientIps.filter(ip => ip).distinct();
    client.metaDataJSON = JSON.stringify(this._metaDataJSON || {});

    if(!client.gender){
        console.log("No gender provided. Trying to guess from name. '" + client.name + "'");
        client.gender = client.guessGender(client.name).getGender();
    }

    client.updateOrderStats(next);
});

Client.schema.methods.update = function(){
    if(!this.debounceSave) this.debounceSave = this.save.debounce(10); 
    return this.debounceSave.apply(this, arguments);
};

Client.schema.methods.getOrders = function(){
    var client = this;
    
    if (client.phoneNumber)
        client.phoneNumber = client.phoneNumber.cleanPhoneNumber();

    var findOption = { "$or": [] };
    if (client.phoneNumber)
        findOption.$or.push({
            "delivery.phoneNumber": new RegExp(client.phoneNumber.substr(3))
        });

    if (client.email)
        findOption.$or.push({
            "delivery.email": new RegExp(client.email.escapeRegExp(), "i")
        });

    if (findOption.$or.length) {
        return new Promise(resolve => {
            keystone.list("Order").model.find(findOption)
                .sort({ orderDate: -1 })
                .deepPopulate('client,cart.product.priceOptions.option')
                .exec((err, orders) => {
                    if (err)
                        return resolve(null);

                    orders = orders.filter(x => x);
                    resolve(orders);
                });
        });
    }

    return Promise.resolve(null);
}

Client.schema.methods.getFavouriteDrinks = async function(count, filter){
    count = count || 10;
    filter = filter || (() => true);

    var orders = await client.getOrders();
    if(!orders) return;

    var drinks = orders.selectMany(o => o.cart && o.cart.map(c => c.product) || []);
    var grouped = Object.values(drinks.groupBy(d => d._id.toString()))
        .orderByDescending(g => g.length);

    var favourites = grouped.filter(filter).splice(0, count).map(g => g[0]);

    return favourites;
}

Client.schema.methods.updateOrderStats = async function (next) {
    var client = this;

    var orders = await client.getOrders();
    if(!orders) return typeof next == "function"? next(): null;

    if (client.orderCount && client.orderCount == orders.length)
        if (typeof next == "function") return next();                

    client.orderCount = orders.length;
    client.orderValue = orders.sum(order => order && order.total) || 0;
    client.avgOrderValue = orders.avg(order => order && order.total) || 0;
    client.lastOrderDate = orders.max(order => order && order.orderDate);

    console.log("Saving client details!", 
        "Client Name:", (client.name || client.phoneNumber) + ",", 
        "Order Count:", client.orderCount + ",", 
        "Order Value:", client.orderValue + ",",
        "Avg Order Value:", client.avgOrderValue);
    if(typeof next == "function") 
        next();
    else
        client.update();
};

Client.register();