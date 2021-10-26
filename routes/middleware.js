/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
var _ = require('lodash');
var keystone = require("keystone");
var isMobile = require('../helpers/isMobile');
var memCache = require("memory-cache");

function requestCache(duration, _key) {
    duration = duration || 30;
    return (req, res, next) => {
        if (req.xhr)
            return next();

        res.locals = res.locals || {};

        try {
            let isMobile = (res.locals.isMobile != undefined) ? res.locals.isMobile : (res.locals.isMobile = mobile(req));
            let key = '__express__' + (isMobile ? "_mobile_" : "") + (_key || req.session.id) + "[" + (req.originalUrl || req.url) + "]";
            let cacheContent = memCache.get(key);
            if (cacheContent) {
                return res.send(cacheContent);
            } else {
                var resSend = res.send;
                res.send = (body) => {
                    memCache.put(key, body, duration * 1000);
                    resSend.call(res, body);
                };
                next();
            }
        } catch (e) {
            console.warn("Error while getting cached http response!", e);
            memCache.clear();
            next();
        }
    };
}

exports.globalCache = (req, res, next) => next(); //**/ requestCache((process.env.CACHE_TIME || 30 * 60) * 60, "/");

exports.sessionCache = requestCache((process.env.CACHE_TIME || 10) * 60);

/**
 Initialises the standard view locals

 The included layout depends on the navLinks array to generate
 the navigation in the header, you may wish to change this array
 or replace it with your own templates / logic.
 */
exports.initLocals = function (req, res, next) {

    //App Logo
    res.locals.appLogo = keystone.get("logo");

    //App Title
    res.locals.appTitle = keystone.get("name");

    //App Url
    res.locals.appUrl = keystone.get("url");

    //App
    res.locals.app = req.headers.packagename;
    
    //AppVersion
    res.locals.appVersion = global.appVersion = req.headers.appversion;

    //Geolocation
    if(req.headers.geolocation){
        var regex = /geo:(-?\d+\.?\d*),(-?\d+\.?\d*);cgen=gps/i;
        var split = regex.exec(req.headers.geolocation);
        
        res.locals.appGeolocation = {
            lat: split[1],
            lng: split[2]
        };

        console.log("Geolocation:", res.locals.appGeolocation);
    } 

    //Push Notification VAPID public key
    res.locals.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    //OKHi Env
    res.locals.OkHiEnv = process.env.OKHI_ENV;
    
    //OKHi Key
    res.locals.OkHiKey = res.locals.OkHiEnv == "prod" ? process.env.OKHI_KEY : process.env.OKHI_DEV_KEY;

    //CSRF
    res.locals.csrf_token = keystone.security.csrf.getToken(req, res);

    //Cart items
    res.locals.cartItems = Object.values(req.session.cart || {}).orderBy(c => c.product.name);

    //Some user data
    if (req.session.userData && req.session.userData.saveInfo)
        res.locals.userData = req.session.userData;

    //Promo code applied
    res.locals.promocode = req.session.promo;

    //Check mobile device
    res.locals.isMobile = isMobile(req);

    //Image placeholder
    res.locals.placeholderImg = "https://uploads-ssl.webflow.com/57e5747bd0ac813956df4e96/5aebae14c6d254621d81f826_placeholder.png";

    //Client IP
    var possibleIps = [req.ip, (req.headers['x-forwarded-for'] || '').split(',').pop(), req.connection.remoteAddress, req.socket.remoteAddress];
    res.locals.clientIp = possibleIps.find(ip => ip && ip != '127.0.0.1' && ip != '::1');

    //Close of day Date    
    var latest = require('../helpers/LocalStorage').getInstance("closeofday").getAll().orderBy(c => c.createdDate).last();        
    if (latest && latest.createdDate)
        res.locals.lastCloseOfDay = new Date(latest.createdDate).toISOString().substr(0, 10);
    else {
        var backdate = process.env.NODE_ENV == "production"? 7: 100;        
        res.locals.lastCloseOfDay = new Date().addDays(-backdate).toISOString().substr(0, 10);
    }

    //Authorization
    var { username, password } = getAuthInfo(req);
    //Other locals only applied to views and not ajax calls
    if (username || password) {         
        return next();
    } else if (req.xhr) {
        var csrf_token = keystone.security.csrf.requestToken(req);
        if (!csrf_token || !keystone.security.csrf.validate(req, csrf_token))
            return res.send({
                response: 'error',
                message: "CSRF validation failed!"
            });
        else {
            return next();
        }
    } else {
        var istart = new Date();

        //AppUser user
        res.locals.user = req.user;

        //Contact number
        res.locals.contactNumber = "+" + (process.env.CONTACT_PHONE_NUMBER || "0723688108").cleanPhoneNumber();

        //Environment
        //res.locals.env = process.env.NODE_ENV;

        //To use uglified files in production
        res.locals.dotmin = process.env.NODE_ENV == "production" ? ".min" : "";

        //Initiate Page details
        res.locals.page = {
            title: keystone.get("name"),
            canonical: [res.locals.appUrl, req.originalUrl].filter(p => p).map(p => p.trim('/')).join('/')
        };

        Promise.all([
            exports.initTopMenuLocals(req, res),
            exports.initBreadCrumbsLocals(req, res),
            exports.initBrandsLocals(req, res),
            exports.initPageLocals(req, res)
        ]).then(function () {
            next();
            var ms = new Date().getTime() - istart.getTime();
            if (process.env.NODE_ENV == "development" || ms > 300)
                console.log("Initiated Locals in ", ms, "ms");
        });
    }
};

exports.initPageLocals = function (req, res, next) {
    var cleanId = req.originalUrl.cleanId();
    var cachedPage = memCache ? memCache.get("__page__" + cleanId) : null;

    if (cachedPage) {
        res.locals.page = Object.assign(res.locals.page || {}, cachedPage || {});

        if (typeof next == "function")
            next(err);

        return Promise.resolve();
    }

    var regex = new RegExp("(" + cleanId.escapeRegExp() + ")", "i");
    return keystone.list('Page').model
        .find({ key: regex })
        .exec((err, pages) => {
            var page = pages.orderBy(m => m.href.length - cleanId.length).first();
            res.locals.page = Object.assign(res.locals.page, (page && page.toObject()) || {});

            if (memCache)
                memCache.put("__page__" + cleanId, res.locals.page, ((process.env.CACHE_TIME || 10) * 60) * 1000);

            if (typeof next == "function")
                next(err);
        });

};

exports.initBrandsLocals = function (req, res, next) {
    var cachedPage = memCache ? memCache.get("__popularbrands__") : null;

    if (cachedPage) {
        res.locals.groupedBrands = Object.assign(res.locals.groupedBrands || {}, cachedPage || {});

        if (typeof next == "function")
            next(err);

        return Promise.resolve(cachedPage);
    }

    return keystone.list('ProductBrand').findPopularBrands((err, brands, products) => {
        if (!err) {
            groups = brands.groupBy(b => (b.category && b.category.name) || "_delete");

            delete groups._delete;
            delete groups.Others;
            delete groups.Extras;

            for (var i in groups)
                groups[i] = groups[i]
                //.orderByDescending(b => products
                //    .filter(p => p.brand && b._id == (p.brand._id || p.brand))
                //    .avg(p => p.popularity))
                .slice(0, 10);

            res.locals.groupedBrands = groups;

            if (memCache)
                memCache.put("__popularbrands__", res.locals.groupedBrands, ((process.env.CACHE_TIME || 10) * 60) * 1000);

        }
        if (typeof next == "function")
            next(err);
    });
};

exports.initBreadCrumbsLocals = function (req, res, next) {
    var cleanId = req.originalUrl.cleanId();
    var cachedPage = memCache ? memCache.get("__breadcrumbs__" + cleanId) : null;

    if (cachedPage) {
        res.locals.breadcrumbs = (cachedPage || []).filter(b => b.label).distinctBy(b => b.label);

        if (typeof next == "function")
            next(err);

        return Promise.resolve();
    }

    //Load breadcrumbs
    var regex = new RegExp("(" + req.originalUrl.cleanId().escapeRegExp() + ")", "i");

    return keystone.list('MenuItem').model
        .find({ key: regex })
        .sort({ index: 1 })
        .deepPopulate("parent.parent.parent")
        .exec((err, menus) => {
            if(err || !menus)
                return next(err || "Unknow error reading menus!");

            var menu = menus.orderBy(m => m.href.length).first();

            var breadcrumbs = [];
            if (menu) {
                do {
                    breadcrumbs.push(menu);
                } while (menu = menu.parent);
            }

            if (breadcrumbs.length){
                breadcrumbs = breadcrumbs.reverse()
                    .filter(b => b.label)
                    .distinctBy(b => b.index)
                    .distinctBy(b => (b.href || "").replace(/^https?\:\/\/[^\/]*/,"").toLowerCase().trim());
                    
                res.locals.breadcrumbs = breadcrumbs;
            }else
                res.locals.breadcrumbs = [{
                    "label": "Home",
                    "href": "/"
                }];

            if (memCache)
                memCache.put("__breadcrumbs__" + cleanId, res.locals.breadcrumbs, ((process.env.CACHE_TIME || 10) * 60) * 1000);

            if (typeof next == "function")
                next(err);
        });
};

exports.initTopMenuLocals = function (req, res, next) {
    var cachedPage = memCache ? memCache.get("__topmenu__") : null;

    if (cachedPage) {
        res.locals.navLinks = Object.assign(res.locals.navLinks || {}, cachedPage || {});

        if (typeof next == "function")
            next(err);

        return Promise.resolve();
    }

    //TopMenu
    return keystone.list('MenuItem').model
        .find({ level: 1, type: "top" })
        .sort({ index: 1 })
        .populate('submenus')
        .exec((err, menu) => {
            if (err)
                throw err;

            res.locals.navLinks = menu
                .filter(m => m.show)
                .orderBy(m => {
                    m.submenus = m.submenus.orderBy(n => n.index);
                    return m.index
                })
                .distinctBy(m => m.label.cleanId());


            if (memCache)
                memCache.put("__topmenu__", res.locals.navLinks, ((process.env.CACHE_TIME || 10) * 60) * 1000);

            if (typeof next == "function")
                next(err);
        });
};

/**
 Fetches and clears the flashMessages before a view is rendered
 */
exports.flashMessages = function (req, res, next) {
    var flashMessages = {
        info: req.flash('info'),
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error'),
    };
    
    res.locals.messages = _.some(flashMessages, msgs =>  msgs.length) ? flashMessages : false;

    next();
};

exports.requireAPIUser = function (req, res, next) {
    //GET Client by sessionID       
    return setAppUserFromSession(req, res, (err, client) => {
        if (client || res.locals.appUser || req.xhr)
            return next();

        return setAppUserFromAuth(req, res, err => {
            if (err)
                return res.status(401).send(err);
            
            return next();
        });
    });
};

var setAppUser = function (req, res, user) {
    if (!user) 
        return Promise.reject("No matching user found!").catch(console.error);
    else if(user.accountStatus && user.accountStatus != "Active" && (!res.locals.app || res.locals.app != "com.dialadrinkkenya"))
        return Promise.reject(`User ${user.fullName} in ${user.accountStatus} status!`).catch(console.error);
    
    if (res.locals.app == "com.dialadrinkkenya.rider" || res.locals.app == "com.dialadrinkkenya.office") {
        return new Promise((resolve, reject) => {
            keystone.list("AppUser").find({ phoneNumber: user.phoneNumber })
                .catch(reject)
                .then(users => {
                    var tosave = false;
                    var user = users && users[0];
                    
                    res.locals.appUser = global.appUser = user;
                    user.sessions = user.sessions || [];
                    user.clientIps = user.clientIps || [];
                    
                    if (req.sessionID && user.sessions.indexOf(req.sessionID) < 0) {
                        user.sessions.push(req.sessionID);
                        tosave = true;
                    }

                    if (res.locals.clientIp && user.clientIps.indexOf(res.locals.clientIp) < 0) {
                        user.clientIps.push(res.locals.clientIp);
                        tosave = true;
                    }

                    if (tosave)
                        keystone.list("AppUser").save(user);

                    return resolve(user);
                });
        });
    }

    return new Promise((resolve, reject) => {
        keystone.list("Client").model.findOne({ phoneNumber: user.phoneNumber.cleanPhoneNumber() })
            .exec((err, client) => {
                if(err)
                    return reject(err);

                res.locals.appUser = global.appUser = client;

                var tosave = false;
                if (req.sessionID && client.sessions.indexOf(req.sessionID) < 0) {
                    client.sessions.push(req.sessionID);
                    tosave = true;
                }

                if (res.locals.clientIp && client.clientIps.indexOf(res.locals.clientIp) < 0) {
                    client.clientIps.push(res.locals.clientIp);
                    tosave = true;
                }

                if (tosave)
                    client.update();

                return resolve(client);
            });
    });    
};

var setAppUserFromAuth = function (req, res, next) {
    var { scheme, username, password, platform } = getAuthInfo(req);

    req.session.platform = platform;
    if (scheme == "BASIC" && username == "appuser" && password == "Di@l @ dr1nk") {
        return next();
    } else if (scheme == "MOBILE" && username && password) {
        return keystone.list("AppUser").find({
            //$and:[{ accountStatus: "Active" }],
            $or: [
                { phoneNumber: username },
                { phoneNumber: username.cleanPhoneNumber() },
                { username: username },
                { email: new RegExp("^" + username, "i") }
            ]
        }).catch(err => {
            if (err)
                return next({ response: "error", message: "NotAuthorized! " + err });
        }).then(users => {
            
            var user = users.find(c => password == c.password  || c.passwords.contains(password)) ||
                users.filter(c => c.tempPassword && !c.tempPassword.used && c.tempPassword.pwd && c.tempPassword.expiry < Date.now())
                    .find(c => password == c.tempPassword.pwd.encryptPassword().encryptedPassword);

            setAppUser(req, res, user)
                .then(user => next(null, user))
                .catch(err => {
                    if(err) console.error(err);
                    if (users.length)
                        console.log(`${users.length} users match username ${username}.` +
                            `Invalid password? '${password}' '${users.map(u => u.passwords).join(',')}'`);
                    else
                        console.log(`No client match the username ${username}`);

                    return next({
                        response: "error",
                        message: "NotAuthorized"
                    });
                });
        });
    } else {
        return next({
            response: "error",
            message: "NotAuthorized"
        });
    }
};

var setAppUserFromSession = function (req, res, callback) {
    if (res.locals.appUser)
        return Promise.resolve();

    var filter = {
        $or: [{
            sessions: {
                "$elemMatch": {
                    $eq: req.sessionID
                }
            }
        }]
    };
    
    if (req.session.userData){
        filter.$or.push({
            phoneNumber: req.session.userData.phoneNumber.cleanPhoneNumber()
        });
    }

    return keystone.list("AppUser")
        .findOne(filter)
        .catch(err => {
            if(err){
                if (typeof callback == "function")
                    callback(err);
            }
        })
        .then(client => {
            if(!client){
                var err = client ? null : new Error("No client matches sessionId:" + req.sessionID);
                if (typeof callback == "function")            
                    callback(err, client);
                return;
            }

            setAppUser(req, res, client)
                .then(client => typeof callback == "function"? callback(null, client): null)
                .catch(err => typeof callback == "function"? callback(err): null);            
        });
};

var getAuthInfo = function (req) {
    var header = req.headers.authorization || '', // get the header
        scheme = (header.split(/\s+/)[0] || '').toUpperCase(), // the scheme
        token = (header.split(/\s+/)[1] || '').split('|')[1] || "", // and the encoded auth token
        auth = new Buffer.from(token, 'hex').toString(), // convert from base64
        platform = (header.split(/\s+/)[1] || '').split('|')[0] || 'WEB',
        parts = auth.split(/:/), // split on colon
        username = parts[0],
        password = parts[1],
        authTime = parts[2];

    return {
        scheme,
        username,
        password,
        authTime,
        platform
    };
};

/**
 Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
    if (!req.user) {
        req.flash('error', 'Please sign in to access this page.');
        res.redirect('/keystone/signin');
    } else {
        next();
    }
};