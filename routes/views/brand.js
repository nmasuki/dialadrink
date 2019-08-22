var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:brand", function (req, res, next) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'store';

    var regex = new RegExp(req.params.brand.trim(), "i");
    var regex2 = new RegExp(req.params.brand.cleanId().trim(), "i");
    locals.filters = {"$or": [{name: regex}, {key: regex2}]};

    locals.page = Object.assign(locals.page, {h1: req.params.brand.toProperCase()});

    var title = ""
    keystone.list('Product').findByBrand(locals.filters, (err, products) => {
        if (products && products.length) {
            var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
            locals.brand = brands.first();
            if (locals.brand)
            {
                title += locals.brand.name;
                locals.page.meta = locals.brand.description || locals.brand.company.description || title;
                if(locals.brand.pageTitle)
                    locals.page.title = locals.brand.pageTitle;
            }

            var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
            var lastRemovedKey, lastRemoved;
            Object.keys(res.locals.groupedBrands).forEach(k => {
                if (!categories.find(c => k == c.name))
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

            var i = 0;
            while (products[++i] && title.length < 40)
                title += (title ? " - " : "") + products[i].name;

            if (!locals.page.title || locals.page.title == keystone.get("name"))
                locals.page.title = title + " | " + keystone.get("name");

            locals.products = products;
            // Render View
            view.render('products');
        } else
            res.status(404).render('errors/404');
    });
});

module.exports = router;
