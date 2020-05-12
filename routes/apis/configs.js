var keystone = require('keystone');
var cloudinary = require('cloudinary');
var memCache = require("memory-cache");

var Page = keystone.list("Page");
var Location = keystone.list("Location");

var router = keystone.express.Router();

router.get('/', function (req, res) {
    var json = {
        response: "success",
        data: [{
            title: "Site Name",
            value: keystone.get('name')
        }, {
            title: "Site Logo",
            value: keystone.get('logo')
        }, {
            title: "Site Theme",
            value: "#2f93a3"
        }, {
            title: "Site Url",
            value: keystone.get('url')
        }, {
            title: "Min Purchase Order",
            value: res.locals.maxPurchase || 500
        }, {
            title: "Max Purchase Order",
            value: res.locals.maxPurchase || 125000
        }, {
            title: "OkHiEnv",
            value: res.locals.OkHiEnv
        }, {
            title: "OkHiKey",
            value: res.locals.OkHiKey
        }]
    };

    res.send(json);
});

router.get("/banners", function (req, res) {
    var filters = {
        $where: 'this.mobileBannerImages && this.mobileBannerImages.length >= 1'
    };

    Page.model.find(filters)
        .exec((err, pages) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Unexpected error while reading mobile banners! " + err
                });

            var json = {
                response: "error",
                message: ""
            };

            if (pages && pages.length) {
                json.response = "success";
                json.data = pages.selectMany(p => {
                    return p.mobileBannerImages.reverse().map(b => {
                        return {
                            id: p.id,
                            title: p.title,
                            meta: p.meta,
                            image: cloudinary.url(b.public_id, {
                                secure: true,
                                height: 450,
                                crop: "fit",
                            }),
                            status: ""
                        };
                    });
                });

                //console.log(json.data.map(b => b.image));
            }

            res.send(json);
        });
});

router.get("/locations", function (req, res) {
    Location.model.find({
            show: true
        })
        .exec((err, locations) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Unexpected error while reading locations! " + err
                });

            var json = {
                response: "error",
                message: ""
            };

            if (locations && locations.length) {
                json.response = "success";
                json.data = locations.map(l => l.toObject());
            } else {
                json.message = "No locations found!";
            }

            res.send(json);
        });
});

router.get("/tiles", function (req, res, next) {
    var json = {
        response: "error",
        message: "",
        data: []
    };

    var cloudinaryOptions = {
        secure: true,
        transformation: [{
            width: 250,
            height: 250,
            radius: "15",
            crop: "fill"
        }]
    };

    var cachedPage = memCache ? memCache.get("__topmenu__") : null;

    if (cachedPage) {
        navLinks = Object.assign(navLinks || {}, cachedPage || {});
        json.response = "success";
        json.data = navLinks.orderBy(l=>l.index).map(d => {
            return {
                id: d.id,
                slug: d.key,
                name: d.name || '',
                image: (d.image ? cloudinary.url(d.image.public_id, cloudinaryOptions) : res.locals.placeholderImg),
                title: d.pageTitle || '',
                description: d.description || ''
            };
        });

        return res.send(json);
    }

    //TopMenu
    keystone.list('MenuItem').model
        .find({
            level: 1,
            type: "top"
        })
        .sort({
            index: 1
        })
        .populate('submenus')
        .exec((err, menu) => {
            if (err)
                json.message = "Error fetching drinks! " + err;
            else {
                navLinks = menu
                    .filter(m => m.show)
                    .orderBy(m => {
                        m.submenus = m.submenus.orderBy(n => n.index);
                        return m.index
                    })
                    .distinctBy(m => m.label.cleanId());

                if (memCache)
                    memCache.put("__topmenu__", navLinks, ((process.env.CACHE_TIME || 30 * 60) * 60) * 1000);

                json.data = navLinks.map(d => {
                    return {
                        id: d.id,
                        slug: d.key,
                        name: d.name || '',
                        image: (d.image ? cloudinary.url(d.image.public_id, cloudinaryOptions) : res.locals.placeholderImg),
                        title: d.pageTitle || '',
                        description: d.description || ''
                    };
                });

                return res.send(json);
            }
        });

    ProductCategory.model.find()
        .exec((err, categories) => {
            var json = {
                response: "error",
                message: "",
                data: []
            };

            if (err)
                json.message = "Error fetching drinks! " + err;
            else if (categories && categories.length) {
                json.response = "success";
                json.data = categories.map(d => {
                    return {
                        id: d.id,
                        slug: d.key,
                        name: d.name || '',
                        image: (d.image ? cloudinary.url(d.image.public_id, cloudinaryOptions) : res.locals.placeholderImg),
                        title: d.pageTitle || '',
                        description: d.description || ''
                    };
                });
            } else {
                json.response = "success";
                json.message = "No record matching the query";
            }

            res.send(json);
        });
});

exports = module.exports = router;