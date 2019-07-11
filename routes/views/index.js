var keystone = require('keystone');
var pesapalHelper = require('../../helpers/pesapal');

var router = keystone.express.Router();

var Page = keystone.list("Page");
var Order = keystone.list("Order");
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");
var Blog = keystone.list("Blog");

function search(req, res, next) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Skip to page if valid
    if (locals.page && locals.page._id && locals.page.content)
        return next();

    //Searching h1 title
    locals.page = Object.assign(locals.page | {}, {
        h1: ((req.params.query || "").toProperCase() + " drinks").trim()
    });

    locals.page.canonical = "https://www.dialadrinkkenya.com/" + (req.params.query || "Search Results").cleanId();

    if (locals.breadcrumbs) {
        if (req.originalUrl.startsWith("/search"))
            locals.breadcrumbs.push({
                label: "Search Results",
                href: req.originalUrl
            });
        else
            locals.breadcrumbs.push({
                label: (req.params.query || "Search Results").toProperCase(),
                href: req.originalUrl
            });
    }

    function renderResults(products, title) {
        if (req.xhr)
            return res.send({
                success: true,
                results: products.map(p => p.name)
            });

        title = (title || "").toProperCase();

        var i = -1,
            meta = title.replace(/\ \-\ /g, ", ");
        while (products[++i] && meta.length < 100) {
            meta += (meta ? ", " : "") + products[i].name;
            if (title.length < 40)
                title += (title ? ", " : "") + products[i].name;
        }

        if (!locals.page.meta)
            locals.page.meta = meta + ", Best prices online - " + keystone.get("name");

        if (!locals.page.title || locals.page.title == keystone.get("name"))
            locals.page.title = "{1} - {2}".format(title.split(",").first(), title, keystone.get("name"));

        if (products.length == 1) {
            if (locals.breadcrumbs && locals.breadcrumbs.length)
                locals.breadcrumbs.pop();
            renderSingleResults(products.first());
        } else {
            locals.products = products;
            res.locals.uifilters = Product.getUIFilters(products);
            view.render('search');
        }
    }

    function renderSingleResults(product) {
        if (product) {
            locals.product = product;
            delete locals.page.h1;
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
                href: "/" + product.href
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
            locals.page.meta = (product.description || locals.page.meta || product.keyWords.join(" ").truncate(160, ".")).replace(/<(?:.|\n)*?>/gm, '');

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

            product.findSimilar((err, products) => {
                if (products) {
                    locals.similar = products
                        .orderBy(p => Math.abs(p.popularity - product.popularity))
                        .slice(0, 6);

                    var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
                    if (brands.length == 1) locals.brand = brands.first();
                } else {
                    locals.similar = [];
                }
                //popularity goes up
                product.addPopularity(1);
                view.render('product');
            });
        } else
            next(err);
    }

    if (req.params.query) {
        if (req.params.query.toLowerCase() == "giftpacks") {
            Product.findPublished({
                isGiftPack: true
            }, function (err, products) {
                renderResults(products, "Gift Packs");
            });
        } else {
            Product.search(req.params.query, function (err, products) {
                if (err || !products || !products.length) {
                    if (req.originalUrl.startsWith("/search"))
                        renderResults(products);
                    else
                        res.status(404).render('errors/404');
                } else {
                    renderResults(products);
                }
            });
        }
    } else
        next();
}

router.get("/search/:query", search);

router.get("/payment/:orderNo", function (req, res) {
    require('./checkout');
    var view = new keystone.View(req, res);

    Order.model.findOne({
            orderNumber: req.params.orderNo
        })
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
            if (!order)
                return res.status(404).render('errors/404');

            var locals = res.locals;
            if (order.cart && order.cart.length) {
                locals.cartItems = (order.cart || []).orderBy(c => c.product.name);
            } else
                locals.cartItems = [];

            locals.order = order;
            locals.page = Object.assign(locals.page, {
                h1: `Order #${order.orderNumber} Payment. (by ${order.delivery.firstName} ${order.delivery.lastName})`
            });

            locals.userData = req.session.userData;
            locals.breadcrumbs.push({
                href: "/cart",
                label: "My Cart"
            }, {
                href: "/payment/" + order.orderNumber,
                label: "Payment"
            });

            locals.orderUrl = pesapalHelper.getPasaPalUrl(order, req.headers.origin)
            return view.render('checkout');
        });
});

router.get("/location/:location", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    locals.breadcrumbs = locals.breadcrumbs || [];
    locals.breadcrumbs.push({
        href: "/delivery-locations",
        label: "Delivery Locations"
    });

    var regex = new RegExp(req.params.location.cleanId().trim(), "i");

    locals.page = Object.assign(locals.page, {
        title: ""
    });

    var filter = {
        "$or": [{
            href: regex
        }, {
            href: req.params.location
        }]
    };

    keystone.list('Location').model
        .find(filter)
        .exec(function (err, locations) {
            if (locations && locations.length) {
                locals.page.title = locals.page.title || "Drinks Delivery to " + locations[0].name;
                var center = locations[0].location;
                var colors = ["red", "orange", "yellow", "green", "blue"];
                var markers = locations.map((l, i) => `markers=color:${colors[i % colors.length]}%7Clabel:${l.name[0]}%7C${l.location.lat}%2c%20${l.location.lng}`);

                locals.mapUrl = `https://maps.googleapis.com/maps/api/staticmap` +
                    `?center=${center.lat}%2c%20${center.lng}` +
                    `&zoom=13&size=640x400&maptype=roadmap` +
                    `&${markers.join('&')}&key=${process.env.GOOGLE_API_KEY1}`;
                
                locals.mobileMapUrl = locals.mapUrl.replace("640x400", "300x300");

                locals.locations = locations;

                locals.breadcrumbs = locals.breadcrumbs.concat(locations.map(l=>{
                    return {
                        href: l.href,
                        label: l.name                    }                    
                }));
            }

            // Render View
            view.render('location');
        });
});

router.get("/giftpacks", function (req, res, next) {
    req.query = "giftpacks";
    search(req, res, next);
});

router.get("/pricelist", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    Product.findPublished({}, function (err, products) {
        locals.products = products.orderBy(p => p.name);
        locals.lastUpdated = products.map(p => p.modifiedDate).orderBy().last();
        locals.categories = products.map(p => p.category && p.category.name).filter(c => !!c).distinct().orderBy();

        function printPdf(err, html, next) {
            if (html) {
                var pdf = require('html-pdf');

                let filename = encodeURIComponent("drinks pricelist") + '.pdf';

                // Setting response to 'attachment' (download).
                // If you use 'inline/attachment' here it will automatically open/download the PDF
                res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
                res.setHeader('Content-type', 'application/pdf');

                pdf.create(html, {
                    //8.27 × 11.69 in
                    //"height": (11.69) + "in",        // allowed units: mm, cm, in, px
                    //"width": (8.27) + "in",            // allowed units: mm, cm, in, px

                    "format": "A4", // allowed units: A3, A4, A5, Legal, Letter, Tabloid
                    //"orientation": "landscape", // portrait or landscape
                }).toStream(function (err, stream) {
                    if (err)
                        console.warn(err);
                    else
                        stream.pipe(res);
                });
            } else if (next) {
                next(err);
            } else {
                res.status(404).render('errors/404');
            }
        }

        view.render('pricelist', {
            layout: 'newsletter'
        }, printPdf);
    });
});

router.get("/products.json", function (req, res) {
    Product.findPublished({}, function (err, products) {
        if (err)
            return res.send("error fetching drinks");

        res.send(products.map(d => {
            var obj = Object.assign({}, d.toObject(), {
                url: 'https://www.dialadrinkkenya.com/' + d.href,
                image: d.image.secure_url,
                images: d.altImages ? d.altImages.map(a => a && a.secure_url) : [],
                category: d.category ? d.category.name : null,
                categories: d.onOffer ? d.category ? [d.category.name, "offer"] : ["offer"] : d.category ? [d.category.name] : [],
                subcategory: d.subCategory ? d.subCategory.name : null,
                ratings: d.averageRatings,
                ratingCount: d.ratingCount,
                quantity: d.quantity,
                brand: d.brand ? d.brand.name : null,
                company: d.brand && d.brand.company ? d.brand.company.name : null,
                price: d.price,
                currency: d.currency,
                options: d.options
            });

            ["__v", 'priceOptions', 'subCategory', 'altImages', 'href'].forEach(i => {
                delete obj[i];
            });

            return obj;
        }));
    })
});

router.get("/products.xml", function (req, res) {
    var view = new keystone.View(req, res);
    var xml = require('xml');

    Product.findPublished({}, function (err, products) {
        if (err)
            return res.send("error fetching drinks");

        res.locals.products = products;

        view.render('productsXml', {
            layout: false
        }, function (err, xmlText) {
            res.setHeader('Content-Type', 'text/xml');
            res.send(xmlText);
        });
    });
});

function sitemap(req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    var xml = require('xml');

    Page.model.find({})
        .exec((err, pages) => locals.pages = pages.filter(p => p.href && p.content))
        .then(Product.findPublished({})
            .exec((err, products) => {
                locals.products = products;
                locals.brands = products.filter(p => p.brand).map(p => p.brand).distinctBy(b => b.id);
                locals.subCategories = products.filter(p => p.subCategory).map(p => p.subCategory).distinctBy(b => b.id);
            })
            .then(() => ProductCategory.model.find({})
                .exec((err, categories) => locals.categories = categories)
                .then(() => Blog.model.find({})
                    .exec((err, blogs) => locals.blogs = blogs)
                    .then(() => {
                        view.render('sitemapXml', {
                            layout: false
                        }, function (err, xmlText) {
                            res.setHeader('Content-Type', 'text/xml');
                            res.send(xmlText);
                        });
                    }))));
}

router.get('/sitemap', sitemap);
router.get('/sitemap.xml', sitemap);
router.get('/google81a0290a139b9339.html', function (req, res) {
    res.send('google-site-verification: google81a0290a139b9339.html');
});

router.get("/:query", search);

router.get("/:page", function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Render the page
    if (locals.page.content)
        view.render('page');
    else
        res.status(404).render('errors/404');
});

module.exports = router;