var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:category", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'store';
    locals.filters = {
        category: req.params.category || ""
    };

    locals.page = Object.assign(locals.page, {
        h1: locals.filters.category.toProperCase()
    });
    if (!locals.page.bannerImages)
        locals.page.bannerImages = [];

    // Load Products
    view.on('init', function (next) {
        keystone.list('ProductCategory').model.find({
                key: locals.filters.category.cleanId()
            })
            .exec((err, categories) => {
                if (locals.page.title == keystone.get("name"))
                    locals.page.title = "";

                var title = (categories.map(c => (c.pageTitle || "")).first() ||
                    locals.page.title || categories.map(c => c.name).join(" - ")).replace(/ I /g, " | ");

                var filter = {
                    category: {
                        "$in": categories.map(c => c._id)
                    }
                };

                keystone.list('Product').findPublished(filter, (err, products) => {

                    var i = -1,
                        meta = title.replace(/\ \-\ /g, ", ");

                    while (products[++i] && products[i].name && meta.length < 120) {
                        meta += (meta ? ", " : "") + products[i].name.trim();
                        if (title.length < 40)
                            title += (title ? " - " : "") + products[i].name.trim();
                    }

                    if (!locals.page.meta)
                        locals.page.meta = meta + " all available at " + keystone.get("name");

                    locals.page.title = title.trim();
                    if (!locals.page.title.contains(keystone.get("name")))
                        locals.page.title += ", " + keystone.get("name")

                    while (locals.page.title.contains("  "))
                        locals.page.title = locals.page.title.replace(/\ \ /g, " ");

                    locals.products = products;
                    

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if (brands.length == 1) locals.brand = brand;

                    var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
                    var subCategoryGroups = Object.values(products.filter(p => p.subCategory)
                            .groupBy(p => p.subCategory._id))
                            .orderBy(g => -g.length);

                    var brandGroups = Object.values(products.filter(p => p.brand)
                            .groupBy(p => p.brand._id))
                            .orderBy(g => -g.length);

                    var l = 0,
                        i = 0;
                    var regexReplace = new RegExp("Whiskies|Whiskey|" + categories[0].name + "s|" + categories[0].name, "i")
                    var uifilters = subCategoryGroups.map(g => g[0].subCategory).map(p => p.name.replace(regexReplace, "").trim());

                    if (uifilters.length <= 3)
                        uifilters = uifilters.concat(brandGroups.map(g => g[0].brand).map(p => p.name.replace(regexReplace, "").trim()));
                    
                    uifilters.forEach(s => {
                        if (l <= 50) {
                            i += 1;
                            l += s.length;
                        }
                    });

                    res.locals.uifilters = uifilters.slice(0, i);

                    var lastRemovedKey, lastRemoved;
                    Object.keys(res.locals.groupedBrands).forEach(k => {
                        if (!categories.find(c => c && k == c.name)) {
                            lastRemovedKey = k;
                            lastRemoved = res.locals.groupedBrands[k];
                            //delete res.locals.groupedBrands[k];
                        }
                    });

                    if (Object.keys(res.locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                        res.locals.groupedBrands[lastRemovedKey] = lastRemoved;

                    if (!Object.keys(res.locals.groupedBrands).length)
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

    locals.page = Object.assign(locals.page, {
        h1: locals.filters.category.toProperCase()
    });
    if (!locals.page.bannerImages)
        locals.page.bannerImages = [];

    // Load Products
    view.on('init', function (next) {
        keystone.list('ProductSubCategory').model.find({
                key: locals.filters.subcategory.cleanId()
            })
            .exec((err, subCategories) => {
                var title = subCategories.map(c => c.name).join(" - ");
                var filter = {
                    subCategory: {
                        "$in": subCategories.map(c => c._id)
                    }
                };
                keystone.list('Product').findPublished(filter, (err, products) => {

                    var i = -1;
                    while (products[++i] && title.length < 40)
                        title += " - " + products[i].name;

                    if (!locals.page.title || locals.page.title == keystone.get("name"))
                        locals.page.title = title + " | " + keystone.get("name");

                    if (subCategories.first(a => !!a))
                        locals.page.h1 = subCategories.first(a => !!a).name;

                    locals.products = products;

                    var brandGroups = Object.values(products.filter(p => p.brand)
                            .groupBy(p => p.brand._id))
                            .orderBy(g => -g.length);

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if (brands.length == 1)
                        locals.brand = brands.first();

                    {
                        var l = 0,
                            i = 0;

                        var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
                        var regexStr = "Whiskies|Whiskey";
                        if (categories[0])
                            regexStr += "|" + categories[0].name + "(s|ry)|" + categories[0].name;

                        var regexReplace = new RegExp(regexStr, "i");
                        uifilters = brandGroups.map(g => g[0].brand).map(p => p.name.replace(regexReplace, "").trim());

                        uifilters.forEach(s => {
                            if (l <= 50) {
                                i += 1;
                                l += s.length;
                            }
                        });

                        res.locals.uifilters = uifilters.slice(0, i);
                    }

                    if (!Object.keys(res.locals.groupedBrands).length)
                        delete res.locals.groupedBrands;

                    next();
                });
            });
    });

    // Render View
    view.render('products');
})

exports = module.exports = router;