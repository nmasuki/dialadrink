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
var mobile = require('is-mobile');
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

exports.sessionCache = requestCache((process.env.CACHE_TIME || 30 * 60) * 60);

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

    //App Title
    res.locals.appUrl = keystone.get("url");

    //Push Notification VAPID public key
    res.locals.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    //OKHi setup
    res.locals.OkHiEnv = process.env.OKHI_ENV;
    res.locals.OkHiKey = res.locals.OkHiEnv == "prod" ? process.env.OKHI_KEY : process.env.OKHI_DEV_KEY;

    //CSRF
    res.locals.csrf_token = keystone.security.csrf.getToken(req, res);

    //Cart items
    res.locals.cartItems = Object.values(req.session.cart || {}).orderBy(c => c.product.name);

    //Promo code applied
    res.locals.promocode = req.session.promo;

    //Check mobile device
    res.locals.isMobile = mobile(req);

    //
    res.locals.placeholderImg = "https://uploads-ssl.webflow.com/57e5747bd0ac813956df4e96/5aebae14c6d254621d81f826_placeholder.png";

    //Client IP
    var possibleIps = [req.ip, (req.headers['x-forwarded-for'] || '').split(',').pop(), req.connection.remoteAddress, req.socket.remoteAddress];
    res.locals.clientIp = possibleIps.find(ip => ip && ip != '127.0.0.1' && ip != '::1');

    var { username, password } = getAuthInfo(req);
    //Other locals only applied to views and not ajax calls
    if (username || password) {
        //console.log(`API call from IP:${res.locals.clientIp || ""}, User:${username}`);
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

        //Admin user
        res.locals.user = req.user;

        //Contact number
        res.locals.contactNumber = "+" + (process.env.CONTACT_PHONE_NUMBER || "0723688108").cleanPhoneNumber();

        //Environment
        //res.locals.env = keystone.get("env");

        //To use uglified files in production
        res.locals.dotmin = keystone.get("env") == "production" ? ".min" : "";

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
            if (keystone.get("env") == "development" || ms > 300)
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
        .find({
            key: regex
        })
        .exec((err, pages) => {
            var page = pages.orderBy(m => m.href.length - cleanId.length).first();
            res.locals.page = Object.assign(res.locals.page, (page && page.toObject()) || {});

            if (memCache)
                memCache.put("__page__" + cleanId, res.locals.page, ((process.env.CACHE_TIME || 30 * 60) * 60) * 1000);

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
                memCache.put("__popularbrands__", res.locals.groupedBrands, ((process.env.CACHE_TIME || 30 * 60) * 60) * 1000);

        }
        if (typeof next == "function")
            next(err);
    });
};

exports.initBreadCrumbsLocals = function (req, res, next) {
    var cleanId = req.originalUrl.cleanId();
    var cachedPage = memCache ? memCache.get("__breadcrumbs__" + cleanId) : null;

    if (cachedPage) {
        res.locals.breadcrumbs = Array.from(Object.assign(res.locals.breadcrumbs || {}, cachedPage || {})).filter(b => b.label);

        if (typeof next == "function")
            next(err);

        return Promise.resolve();
    }

    //Load breadcrumbs
    var regex = new RegExp("(" + req.originalUrl.cleanId().escapeRegExp() + ")", "i");

    return keystone.list('MenuItem').model
        .find({
            key: regex
        })
        .deepPopulate("parent.parent")
        .exec((err, menus) => {
            var menu = menus.orderBy(m => m.href.length).first();

            var breadcrumbs = [];
            if (menu) {
                do {
                    breadcrumbs.push(menu);
                } while (menu = menu.parent);
            }

            if (breadcrumbs.length)
                res.locals.breadcrumbs = breadcrumbs
                .orderBy(m => m.level)
                .filter(b => b.label)
                .distinctBy(b => (b.href || "").toLowerCase().trim());
            else
                res.locals.breadcrumbs = [{
                    "label": "Home",
                    "href": "/"
                }];

            if (memCache)
                memCache.put("__breadcrumbs__" + cleanId, res.locals.breadcrumbs, ((process.env.CACHE_TIME || 30 * 60) * 60) * 1000);

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
                memCache.put("__topmenu__", res.locals.navLinks, ((process.env.CACHE_TIME || 30 * 60) * 60) * 1000);

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
    res.locals.messages = _.some(flashMessages, function (msgs) {
        return msgs.length;
    }) ? flashMessages : false;

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

var setAppUser = function (req, res, client) {
    if (client) {
        res.locals.appUser = client;

        var tosave = false;
        if (client.sessions.indexOf(req.sessionID) < 0) {
            client.sessions.push(req.sessionID);
            tosave = true;
        }

        if (client.clientIps.indexOf(res.locals.clientIp) < 0) {
            client.clientIps.push(res.locals.clientIp);
            tosave = true;
        }

        if (tosave)
            client.save();

        req.session.save();
    }

    return client;
};

var setAppUserFromAuth = function (req, res, next) {
    var { scheme,  username, password, platform } = getAuthInfo(req);

    req.session.platform = platform;
    if (scheme == "BASIC" && username == "appuser" && password == "Di@l @ dr1nk") {
        return next();
    } else if (scheme == "MOBILE" && username && password) {
        return keystone.list("Client").model.find({
            $or: [
                { phoneNumber: username.cleanPhoneNumber() },
                { username: username },
                { email: username }
            ]
        }).exec((err, clients) => {
            if (err)
                return next({
                    response: "error",
                    message: "NotAuthorized! " + err
                });

            var client = clients.find(c => password == c.password) ||
                clients.find(c => !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd);

            if (setAppUser(req, res, client)) {
                return next(null, client);
            } else {
                if (clients.length)
                    console.log(`${clients.length} clients match username ${username}. Invalid password? '${password}'`);
                else
                    console.log(`No client match the username ${username}`);

                return next({
                    response: "error",
                    message: "NotAuthorized"
                });
            }
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

    return keystone.list("Client").model
        .findOne({
            sessions: {
                "$elemMatch": {
                    $eq: req.sessionID
                }
            }
        })
        .exec((err, client) => {
            if(err){
                if (typeof callback == "function")
                    callback(err);
            }

            setAppUser(req, res, client);

            err = client ? null : new Error("No client matches sessionId:" + req.sessionID);
            if (typeof callback == "function")            
                callback(err, client);
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