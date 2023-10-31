var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:product", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    locals.breadcrumbs = locals.breadcrumbs || [];
    var regex = new RegExp(req.params.product.cleanId().trim(), "i");

    locals.page = Object.assign(locals.page, {
        title: ""
    });

    var filter = {
        "$or": [{
            href: regex
        }, {
            href: req.params.product
        }]
    };

    view.on('init', function (next) {
        keystone.list('Product').findOnePublished(filter, function (err, product) {
            if (product) {
                locals.product = product;

               
                
                var lastRemovedKey, lastRemoved;
                Object.keys(res.locals.groupedBrands).forEach(k => {
                    if (product.category && k != product.category.name) {
                        lastRemovedKey = k;
                        lastRemoved = res.locals.groupedBrands[k];
                        //delete res.locals.groupedBrands[k];
                    }
                });

                if (Object.keys(res.locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                    res.locals.groupedBrands[lastRemovedKey] = lastRemoved;

                if (!Object.keys(res.locals.groupedBrands).length)
                    delete res.locals.groupedBrands;

            
            } else {
                res.status(404).render('errors/404');
            }
        });
    });

    // Render View
    view.render('myproduct');
});

exports = module.exports = router;