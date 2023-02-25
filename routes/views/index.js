var keystone = require('keystone');
var pesapalHelper = require('../../helpers/PesaPal');
var router = keystone.express.Router();

var Page = keystone.list("Page");
var Order = keystone.list("Order");
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");
var MenuItem = keystone.list("MenuItem");
var Blog = keystone.list("Blog");

function search(req, res, next) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Skip to page if valid
    //if (locals.page && locals.page._id && locals.page.content)
    //    return next();

    req.params.query = req.params.query || req.query.q || req.query.query || "";

    var queryTitle = ((req.params.query || req.params.q || "").replace(/[^\w]+/g, " ").toProperCase()).replace(/\s(Whiskies|Whiskey|Wine|Gin)/g, "").trim()
    //Searching h1 title
    locals.page = Object.assign({ h1: queryTitle }, locals.page || {});
    locals.page.h1 = locals.page.h1 || queryTitle;        
    locals.page.canonical = [keystone.get('url'), (req.params.query || req.params.q || "").cleanId()].filter(p => p).map(p => p.trim('/')).join('/');

    var homeGroupSize = process.env.HOME_GROUP_SIZE || 12;

    function renderResults(products, title) {
        title = (title || "").toProperCase();
        locals.page.h1 = locals.page.h1 || title;

        var i = -1, meta = title.replace(/\ \-\ /g, ", ");
        while (products[++i] && meta.length < 100) {
            meta += (meta ? ", " : "") + products[i].name;
            if (title.length < 40)
                title += (title ? (i ? ", " : "|") : "") + products[i].name;
        }

        if (!locals.page.meta)
            locals.page.meta = meta + ", Best prices in Nairobi - " + keystone.get("name");

        if (!locals.page.title || locals.page.title == keystone.get("name"))
            locals.page.title = "{1} - {2}".format(title.split(",").first(), title, keystone.get("name"));

        if (req.xhr || locals.appUser)
            return res.send({
                success: 'success',
                title: locals.page.title,
                meta: locals.page.meta,
                data: products.map(p => p.toAppObject())
            });

        if (products.length == 1) {
            if (locals.breadcrumbs && locals.breadcrumbs.length)
                locals.breadcrumbs.pop();

            renderSingleResults(products.first());
        } else {            
            locals.products = products.slice(0, homeGroupSize * 10);            
            //locals.groupedProducts = Product.groupProducts(products, homeGroupSize);
            locals.uifilters = Product.getUIFilters(locals.products);

            var categories = products.filter(p => p.category).distinctBy(p => p.category.id || p.category);
            var subCategories = products.filter(p => p.subCategory).distinctBy(p => p.subCategory.id || p.subCategory);

            locals.subCategories = subCategories;
            if (categories.length > 2 || subCategories.length > 5)
                return view.render('products');

            if (locals.page.h1.length <= 10) {
                if (categories.length == 1) {
                    var cat = categories[0].category;
                    if (cat && cat.name) {
                        locals.page.h1 += " " + cat.name.trim().toProperCase();
                        //locals.page.title = cat.pageTitle;
                        //locals.page.meta = cat.description || locals.page.meta || meta;
                    }
                } else if (subCategories.length == 1) {
                    var subCat = categories[0] && categories[0].subCategory;
                    if (subCat && subCat.name) {
                        locals.page.h1 += " " + subCat.name.trim().toProperCase();
                        //locals.page.title = subCat.pageTitle;
                        //locals.page.meta = subCat.description || locals.page.meta || meta;
                    }
                }
            }

            if (locals.breadcrumbs) {
                locals.breadcrumbs = locals.breadcrumbs.filter(b => b.label);

                if (req.originalUrl.startsWith("/search"))
                    locals.breadcrumbs.push({
                        label: "Search Results",
                        href: req.originalUrl
                    });
                else {
                    if(locals.breadcrumbs.length == 0){
                        if (categories.length == 1) {
                            var cat = categories[0].category;
                            if (cat && cat.name && !locals.breadcrumbs.find(b => b.label == cat.name))
                                locals.breadcrumbs.push({
                                    label: cat.name,
                                    href: "/" + cat.name.cleanId()
                                });
                        }
                        
                        if (subCategories.length == 1) {
                            var subCat = categories[0].subCategory;
                            if (subCat && subCat.name && !locals.breadcrumbs.find(b => b.label == subCat.name))
                                locals.breadcrumbs.push({
                                    label: subCat.name,
                                    href: "/" + subCat.name.cleanId()
                                });
                        }
                    }
                    
                    var href = req.originalUrl.replace(/^https?\:\/\/[^\/]*/,"").toLowerCase();
                    if (locals.page.h1 && !locals.breadcrumbs.find(b => b.href.replace(/^https?\:\/\/[^\/]*/,"").toLowerCase() == href))
                        locals.breadcrumbs.push({
                            label: locals.page.h1,
                            href: req.originalUrl
                        });
                }
            }

            view.render('products');
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

            locals.page.canonical = [keystone.get('url'), product.href].map(p => p.trim('/')).join('/');
            locals.page.title = product.pageTitle || [
                product.name,
                product.category && product.category.name,
                product.subCategory && product.subCategory.name,
                product.brand && product.brand.name,
            ].filter(a => !!a).join(" - ") + " | " + keystone.get("name");

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

            product.tags = (product.tags || []).distinctBy(t => (t || "").cleanId());
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

                product.findRelated((err, related) => {
                    locals.related = related.filter(r => locals.similar.every(s => s.id != r.id)).slice(0, 6);
                    view.render('product');
                });

            });
        } else
            next(err);
    }

    if(req.params.query == "[object%20Object]" || req.params.query == "[object Object]")
        req.params.query = "giftpacks";

    if (req.params.query) {
        if (req.params.query.toLowerCase() == "giftpacks") {
            Product.findPublished({ isGiftPack: true }, function (err, products) {
                renderResults(products, "Gift Packs");
            });
        } else {
            Product.search(req.params.query, function (err, products) {
                if (err || !products || !products.length) {
                    if (req.originalUrl.startsWith("/search"))
                        renderResults([], req.params.query.replace(/\W/, " "));
                    else {
                        // Render the page content if available
                        if (locals.page.content)
                            view.render('page');
                        else
                            res.status(404).render('errors/404');
                    }
                } else {
                    renderResults(products, req.params.query.replace(/\W/, " "));
                }
            });
        }
    } else
        next();
}

router.get("/search", search);

router.get("/search/:query", search);

router.get("/payment/:orderNo", function (req, res) {
    require('./checkout');
    var view = new keystone.View(req, res);

    Order.model.findOne({
            orderNumber: req.params.orderNo
        })
        .deepPopulate('client,cart.product.priceOptions.option')
        .exec((err, order) => {
            if (!order)
                return res.status(404).render('errors/404');

            var locals = res.locals;
            if (order.cart && order.cart.length) {
                locals.cartItems = (order.cart || [])
                    .orderBy(c => c && c.product && c.product.name);
            } else
                locals.cartItems = [];

            locals.order = order;
            locals.page = Object.assign({
                h1: `Order #${order.orderNumber} Payment. (by ${order.delivery.firstName} ${order.delivery.lastName})`
            }, locals.page || {});

            if (req.session.userData && req.session.userData.saveInfo)
                locals.userData = req.session.userData;

            locals.breadcrumbs.push({
                href: "/cart",
                label: "My Cart"
            }, {
                href: "/payment/" + order.orderNumber,
                label: "Payment"
            });

            locals.orderUrl = pesapalHelper.getPesaPalUrl(order, req.headers.origin);
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

                locals.breadcrumbs = locals.breadcrumbs.concat(locations.map(l => {
                    return {
                        href: l.href,
                        label: l.name
                    }
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
        locals.products = products.orderBy(p => p.name).distinctBy(p => [p.name]);
        locals.lastUpdated = products.map(p => p.modifiedDate).orderBy().last();
        locals.categories = products.map(p => p.category && p.category.name).filter(c => !!c).distinct().orderBy();

        var options = {
            //8.27 × 11.69 in
            //"height": (11.69) + "in",        // allowed units: mm, cm, in, px
            //"width": (8.27) + "in",            // allowed units: mm, cm, in, px
            "phantomPath": "/usr/local/bin/phantomjs",
            "format": "A4", // allowed units: A3, A4, A5, Legal, Letter, Tabloid
            //"orientation": "landscape", // portrait or landscape
        };

        function printPdf(err, html, next) {
            if (html) {
                var pdf = require('html-pdf');
                let filename = encodeURIComponent("drinks pricelist") + '.pdf';

                // Setting response to 'attachment' (download).
                // If you use 'inline/attachment' here it will automatically open/download the PDF
                res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
                res.setHeader('Content-type', 'application/pdf');
                try{
                    pdf.create(html, options).toStream(function (err, stream) {
                        if (err)
                            console.warn(err);
                        else
                            stream.pipe(res);
                    });
                } catch(e){
                    console.error("Error while creating pdf: " + e);
                    res.status(404).render('errors/404');
                }
            } else if (next) {
                next(err);
            } else {
                res.status(404).render('errors/404');
            }
        }

        view.render('pricelist', { layout: 'newsletter' }, printPdf);
    });
});

router.get("/products.json", function (req, res) {
    Product.findPublished({}, function (err, products) {
        if (err)
            return res.send("error fetching drinks");

        res.send(products.map(d => {
            var obj = Object.assign({}, d.toObject(), {
                url: [keystone.get('url'), d.href].filter(p => p).map(p => p.trim('/')).join('/'),
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

async function sitemap(req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    locals.links = [];

    function addLinks(links) {
        if(links)
            links.forEach(l => {
                var found = locals.links.find(p => l.href == p.href);
                if (found) {
                    if (!found.modifiedDate || found.modifiedDate < l.modifiedDate)
                        found.modifiedDate = l.modifiedDate;
                    if (found.priority < l.priority)
                        found.priority = l.priority;
                } else if (l.href) {
                    locals.links.push(l);
                }
            });
    }

    function linksFromMenus(menus){
        let links = menus?.distinctBy(m => m.href)
            .orderBy(m => m.index * 10 - (m.level) + m.href.length / 100)
            .map(m => {
                return {
                    href: m.href,
                    priority: (m.level == 0 ? 1.0 : 0.7 + (1.0 - 0.7) / m.level),
                    modifiedDate: m.modifiedDate
                };
            });

        return links;
    }

    function linksFromPages(pages){
        let links = pages?.filter(p => p.href && p.content)
            .map(p => {
                return {
                    href: p.href,
                    priority: 0.85,
                    modifiedDate: p.modifiedDate
                };
            });
            
        return links;
    }

    function linksFromProducts(products){
        var brands = products.filter(p => p.brand).map(p => p.brand).distinctBy(b => b.id);
        var companies = brands.filter(p => p.company && p.company.name).map(p => p.company).distinctBy(b => b.name);
        var subCategories = products.filter(p => p.subCategory).map(p => p.subCategory).distinctBy(b => b.id);

        let links = products?.map(p => {
            return {
                href: p.href,
                modifiedDate: p.modifiedDate,
                priority: 0.9999 * p.popularityRatio
            };
        });

        links = links.concat(subCategories?.map(p => {
            return {
                href: p.key.trim('/').trim(),
                modifiedDate: p.modifiedDate,
                priority: 0.75
            };
        }));

        links = links.concat(brands?.map(p => {
            return {
                href: p.href,
                modifiedDate: p.modifiedDate,
                priority: 0.7
            };
        }));

        links = links.concat(companies?.map(p => {
            return {
                href: p.name.cleanId(),
                priority: 0.5
            };
        }));

        return links;
    }

    function linksFromCategories(categories){
        let links = categories?.map(p => {
            return {
                href: p.key.trim('/').trim(),
                modifiedDate: p.modifiedDate,
                priority: 0.78
            }
        });

        return links;
    }

    function linksFromBlogss(blogs){
        let links = blogs.map(p => {
            return {
                href: p.href,
                modifiedDate: p.publishedDate,
                priority: 0.76
            };
        });

        return links;
    }

    var menus = await  MenuItem.model.find({}).sort({ index: 1, level: -1 }).exec();
    var pages = await Page.model.find({}).exec();
    var products = await Product.findPublished({}).exec();
    var categories = await ProductCategory.model.find({}).exec();
    var blogs = await Blog.model.find({}).exec();

    let links = linksFromMenus(menus)
        .concat(linksFromPages(pages))
        .concat(linksFromProducts(products))
        .concat(linksFromCategories(categories))
        .concat(linksFromBlogss(blogs))
    
    addLinks(links);

    locals.links = locals.links.orderBy(l => -l.priority + l.href.length / 100000);
    view.render('sitemapXml', { layout: false }, function (err, xmlText) {
        res.setHeader('Content-Type', 'text/xml');
        res.send(xmlText);
    });    
}

router.get('/sitemap', sitemap);
router.get('/sitemap.xml', sitemap);
router.get('/google81a0290a139b9339.html', function (req, res) {
    res.send('google-site-verification: google81a0290a139b9339.html');
});

router.get("/:query", search);

module.exports = router;