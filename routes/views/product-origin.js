var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:productOrigin", function (req, res, next) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'store';

    var regex = new RegExp(req.params.productOrigin.trim(), "i");
    var regex2 = new RegExp(req.params.productOrigin.cleanId().trim(), "i");
    locals.filters = {"$or": [{countryOfOrigin: regex}, {countryOfOrigin: regex2}]};

    locals.page = Object.assign({h1: req.params.productOrigin.toProperCase()}, locals.page || {});

    var title = ""
    keystone.list('Product').findPublished(locals.filters, (err, products) => {
        if (products && products.length) {
            locals.countryOfOrigin = products.map(p => p.products).first();
            if (locals.productOrigin)
            {
                if(locals.page.h1 == req.params.productOrigin.toProperCase())
                    locals.page.h1 = locals.productOrigin.toProperCase();

                title += locals.productOrigin; 
                if(locals.productOrigin.pageTitle)
                    locals.page.title = locals.productOrigin.pageTitle;
            }

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
