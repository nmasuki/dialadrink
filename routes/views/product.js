var keystone = require('keystone');
var router = keystone.express.Router();
var ProductRating = keystone.list('ProductRating');

router.get("/:product", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    var regex = new RegExp(req.params.product.cleanId().trim(), "i");

    locals.page = Object.assign(locals.page, {title: ""});

    view.on('init', function (next) {
        keystone.list('Product').findOnePublished({href: regex}, function (err, product) {
            if (product) {
                locals.product = product;

                [
                    product.category && product.category.name,
                    product.subCategory && product.subCategory.name,
                    product.name
                ].filter(i => !!i).forEach(i => {
                    locals.breadcrumbs.push({
                        label: i,
                        href: "/" + i.toLowerCase()
                    })
                });

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

                locals.userRating = product.ratings && product.ratings.find(r => r.userId === req.session.id);

                product.findSimilar((err, products) => {
                    if (products)
                        locals.similar = products
                            .orderBy(p => Math.abs(p.popularity - product.popularity))
                            .slice(0, 10);


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

router.get("/rate/:product/:rating", function (req, res) {
    keystone.list('Product').findOnePublished({href: req.params.product})
        .exec(function (err, product) {
            if (product) {

                var userRating = new ProductRating.model({
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


                return res.send({state: true, rating: userRating})
            }
            next(err);
        });
});

exports = module.exports = router;
