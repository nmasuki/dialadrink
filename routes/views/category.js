var keystone = require('keystone');
var router = keystone.express.Router();
var Product = keystone.list('Product');
var ProductCategory = keystone.list('ProductCategory');

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
        ProductCategory.model.find({
                key: locals.filters.category.cleanId()
            })
            .exec((err, categories) => {
                if (locals.page.title == keystone.get("name"))
                    locals.page.title = "";
                
                locals.page.canonical = "https://www.dialadrinkkenya.com/" + categories.map(c => (c.key || "")).first();

                var title = (categories.map(c => (c.pageTitle || "")).first() ||
                    locals.page.title || categories.map(c => c.name).join(" - ")).replace(/ I /g, " | ");

                var filter = {
                    category: {
                        "$in": categories.map(c => c._id)
                    }
                };

                Product.findPublished(filter, (err, products) => {
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
                        locals.page.title += ", " + keystone.get("name");

                    while (locals.page.title.contains("  "))
                        locals.page.title = locals.page.title.replace(/\ \ /g, " ");

                    locals.products = products;                    

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if (brands.length == 1) locals.brand = brands[0];

                    res.locals.uifilters = Product.getUIFilters(products);

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
});

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
                Product.findPublished(filter, (err, products) => {

                    var i = -1;
                    while (products[++i] && title.length < 40)
                        title += " - " + products[i].name;

                    if (!locals.page.title || locals.page.title == keystone.get("name"))
                        locals.page.title = title + " | " + keystone.get("name");

                    if (subCategories.first(a => !!a))
                        locals.page.h1 = subCategories.first(a => !!a).name;

                    locals.products = products;

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if (brands.length == 1)
                        locals.brand = brands.first();

                    res.locals.uifilters = Product.getUIFilters(products);

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