var keystone = require('keystone');
var router = keystone.express.Router();
var ProductRating = keystone.list('ProductRating');

router.get("/:product", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    var regex = new RegExp(req.params.product.cleanId().trim(), "i");

    locals.page = Object.assign(locals.page, {title: ""});

    var filter = {"$or": [{href: regex}, {href: req.params.product}]}

    view.on('init', function (next) {
        keystone.list('Product').findOnePublished(filter, function (err, product) {
            if (product) {
                locals.product = product;

                if (product.category && product.category.name) {
                    locals.breadcrumbs.push({
                        label: product.category.name,
                        href: ["/category", product.category.key].join("/")
                    });

                    if (product.subCategory && product.subCategory.name)
                        locals.breadcrumbs.push({
                            label: product.subCategory.name,
                            href: ["/category", product.category.key, product.subCategory.key].join("/")
                        });
                }

                locals.breadcrumbs.push({
                    label: product.name,
                    href: "/product/" + product.href
                });

                locals.page.title = product.pageTitle || [
                    product.name,
                    product.category && product.category.name,
                    product.subCategory && product.subCategory.name,
                    product.brand && product.brand.name,
                ].filter(a => !!a).join(" - ") + " | " + keystone.get("name");
                locals.page.canonical = "https://www.dialadrinkkenya.com/" + product.href;

                locals.userRating = product.ratings && product.ratings.find(r => r.userId === req.session.id);
                locals.page.keyWords = product.keyWords.join(", ");
                locals.page.meta = locals.page.meta || product.keyWords.join(" ").truncate(160, ".");

                var lastRemovedKey, lastRemoved;
                Object.keys(res.locals.groupedBrands).forEach(k => {
                    if (product.category && k != product.category.name)
                    {
                        lastRemovedKey = k;
                        lastRemoved = res.locals.groupedBrands[k];
                        //delete res.locals.groupedBrands[k];
                    }
                });

                if(Object.keys(res.locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                    res.locals.groupedBrands[lastRemovedKey] = lastRemoved;

                if (!Object.keys(res.locals.groupedBrands).length)
                    delete res.locals.groupedBrands;

                product.findSimilar((err, products) => {
                    if (products)
                        locals.similar = products
                            .orderBy(p => Math.abs(p.popularity - product.popularity))
                            .slice(0, 6);

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    var brand = brands.first();

                    if (brands.length == 1) locals.brand = brands.first();

                    //popularity goes up
                    product.addPopularity(1);
                    next(err);
                });
            } else
                next(err);
        });
    });

// Render View
    view.render('product');
});

router.get("/rate/:product/:rating", function (req, res, next) {
    keystone.list('Product').findOnePublished({_id: req.params.product})
        .exec(function (err, product) {
            if (product) {

                var userRating = product.ratings.find(r => r.userId == req.session.id);
                if (!userRating) {
                    userRating = new ProductRating.model({
                        userId: req.session.id,
                        product: product,
                        rating: req.params.rating,
                    });

                    userRating.save((err, a) => {
                        if (err)
                            console.err(err);

                        product.ratings.push(userRating);
                        product.save();
                    });
                } else {

                }

                return res.send({state: true, rating: userRating})
            }
            next(err);
        });
});

exports = module.exports = router;
