var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:category", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'store';
    locals.filters = {category: req.params.category};

    locals.page = Object.assign(locals.page, {h1: locals.filters.category.toProperCase()});
    if (!locals.page.bannerImages)
        locals.page.bannerImages = [
            "/assets/twall.jpg", "/assets/twall1.jpg", "/assets/twall2.jpg",
            "/assets/twall3.jpg", "/assets/twall4.jpg"
        ];


    // Load Products
    view.on('init', function (next) {
        keystone.list('ProductCategory').model.find({key: locals.filters.category.cleanId()})
            .exec((err, categories) => {
                var title = categories.map(c => c.name).join(" - ");
                locals.page.title = categories.map(c => (c.pageTitle || "").replace(/I/g, "|")).first();

                var filter = {category: {"$in": categories.map(c => c._id)}};
                keystone.list('Product').findPublished(filter, (err, products) => {

                    var i = -1, meta = title.replace(/\ \-\ /g, ", ");
                    while (products[++i] && meta.length < 120) {
                        meta += (meta ? ", " : "") + products[i].name.trim();
                        if (title.length < 40)
                            title += (title ? " - " : "") + products[i].name.trim();
                    }

                    if (!locals.page.meta)
                        locals.page.meta = meta + " all available at " + keystone.get("name");

                    if (!locals.page.title || locals.page.title == keystone.get("name"))
                        locals.page.title = title.trim() + " | " + keystone.get("name");

                    while (locals.page.title.contains("  "))
                        locals.page.title = locals.page.title.replace(/\ \ /g, " ");

                    locals.products = products;

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if(brands.length == 1) locals.brand = brand;

                    var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
                    var lastRemovedKey, lastRemoved;
                    Object.keys(res.locals.groupedBrands).forEach(k => {
                        if (!categories.find(c=> c && k == c.name))
                        {
                            lastRemovedKey = k;
                            lastRemoved = res.locals.groupedBrands[k];
                            //delete res.locals.groupedBrands[k];
                        }
                    });

                    if(Object.keys(res.locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                        res.locals.groupedBrands[lastRemovedKey] = lastRemoved;

                    if(!Object.keys(res.locals.groupedBrands).length)
                        delete res.locals.groupedBrands;


                    next();
                });
            });
    });

    // Render View
    view.render('products');
})

router.get("/:category/:subcategory", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.filters = {
        category: req.params.category,
        subcategory: req.params.subcategory
    };

    locals.page = Object.assign(locals.page, {h1: locals.filters.category.toProperCase()});
    if (!locals.page.bannerImages)
        locals.page.bannerImages = [
            "/assets/twall.jpg", "/assets/twall1.jpg", "/assets/twall2.jpg",
            "/assets/twall3.jpg", "/assets/twall4.jpg"
        ];

    // Load Products
    view.on('init', function (next) {
        keystone.list('ProductSubCategory').model.find({key: locals.filters.subcategory.cleanId()})
            .exec((err, subCategories) => {
                var title = subCategories.map(c => c.name).join(" - ");
                var filter = {subCategory: {"$in": subCategories.map(c => c._id)}};
                keystone.list('Product').findPublished(filter, (err, products) => {

                    var i = -1;
                    while (products[++i] && title.length < 40)
                        title += " - " + products[i].name;

                    if (!locals.page.title || locals.page.title == keystone.get("name"))
                        locals.page.title = title + " | " + keystone.get("name");

                    if (subCategories.first(a => !!a))
                        locals.page.h1 = subCategories.first(a => !!a).name;

                    locals.products = products;

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if(brands.length == 1) 
                        locals.brand = brands.first();
/*
                    var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
                    var lastRemovedKey, lastRemoved;
                    Object.keys(res.locals.groupedBrands).forEach(k => {
                        if (!categories.find(c=> c && k == c.name))
                        {
                            lastRemovedKey = k;
                            lastRemoved = res.locals.groupedBrands[k];
                            delete res.locals.groupedBrands[k];
                        }
                    });
*/
                    if(Object.keys(res.locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                        res.locals.groupedBrands[lastRemovedKey] = lastRemoved;

                    if(!Object.keys(res.locals.groupedBrands).length)
                        delete res.locals.groupedBrands;

                    next();
                });
            });
    });

    // Render View
    view.render('products');
})

exports = module.exports = router;
