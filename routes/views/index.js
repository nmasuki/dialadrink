var keystone = require('keystone');
var router = keystone.express.Router();

var Page = keystone.list("Page");
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");
var ProductSubCategory = keystone.list("ProductSubCategory");
var ProductBrand = keystone.list("ProductBrand");

function search(req, res, next) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Skip to page if valid
    if (locals.page._id && locals.page.content)
        return next();

    //Searching h1 title
    locals.page = Object.assign(locals.page, {
        h1: req.params.query.toProperCase() + ` drinks`
    });

    if (req.originalUrl.startsWith("/search"))
        locals.breadcrumbs.push({
            label: "Search Results",
            href: req.originalUrl
        });

    function renderResults(products, title) {
        title = title || "";

        var i = -1, meta = title.replace(/\ \-\ /g, ", ");
        while (products[++i] && meta.length < 100) {
            meta += (meta ? ", " : "") + products[i].name;
            if (title.length < 40)
                title += (title ? ", " : "") + products[i].name;
        }

        if (!locals.page.meta)
            locals.page.meta = meta + " all available at " + keystone.get("name");

        if (!locals.page.title || locals.page.title == keystone.get("name"))
            locals.page.title = title + " | " + keystone.get("name");

        locals.products = products;

        view.render('search');
    }

    if (req.params.query)
        Product.search(req.params.query, function (err, products) {
            if (err || !products || !products.length) {
                if (req.originalUrl.startsWith("/search"))
                    res.status(404).render('errors/404');
                else
                    next();
            } else {
                renderResults(products, req.params.query.toProperCase())
            }
        });
    else
        next();
}

router.get("/search/:query", search);

router.get("/home", function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'home';

    // Render the view
    view.render('index');
});

router.get("/pricelist", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    Product.findPublished({}, function (err, products) {
        locals.products = products.orderBy(p => p.name);
        locals.lastUpdated = products.map(p => p.modifiedDate).orderBy().first();
        locals.categories = products.map(p => p.category && p.category.name).filter(c => !!c).distinct().orderBy();

        function printPdf(err, html) {
            var pdf = require('html-pdf');

            let filename = encodeURIComponent("DIAL A DRINK PRICELIST") + '.pdf';
            // Setting response to 'attachment' (download).
            // If you use 'inline/attachment' here it will automatically open/download the PDF
            res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
            res.setHeader('Content-type', 'application/pdf');

            pdf.create(html, {
                //8.27 × 11.69 in
                "height": "11.69in",        // allowed units: mm, cm, in, px
                "width": "8.27in",            // allowed units: mm, cm, in, px

                //"format": "A4",             // allowed units: A3, A4, A5, Legal, Letter, Tabloid
                //"orientation": "landscape", // portrait or landscape
            }).toStream(function (err, stream) {
                stream.pipe(res);
            });
        }

        view.render('pricelist', {layout: 'newsletter'}, printPdf);
    });
});

router.get("/products.json", function (req, res) {
    Product.findPublished({}, function (err, products) {
        if (err)
            return res.send("error fetching drinks");

        res.send(products.map(d => {
            var obj = Object.assign({}, d.toObject(), {
                url: 'https://www.dialadrinkkenya.com/product/' + d.href,
                image: d.image.secure_url,
                images: d.altImages ? d.altImages.map(a => a && a.secure_url) : [],
                category: d.category ? d.category.name : null,
                categories: d.onOffer ? d.category ? [d.category.name, "offer"] : ["offer"] : d.category ? [d.category.name] : [],
                subcategory: d.subCategory ? d.subCategory.name : null,
                ratings: d.avgRatings,
                quantity: d.quantity,
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

router.get("/products.xml", function (req, res,) {
    var view = new keystone.View(req, res);
    var xml = require('xml');

    Product.findPublished({}, function (err, products) {
        if (err)
            return res.send("error fetching drinks");

        res.locals.products = products;

        view.render('productsXml', {layout: false}, function (err, xmlText) {
            res.setHeader('Content-Type', 'text/xml');
            res.send(xmlText)
        });
    });
});

router.get('/sitemap', function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;
    var xml = require('xml');

    Page.model.find({})
        .exec((err, pages) => locals.pages = pages)
        .then(Product.findPublished({})
            .exec((err, products) => locals.products = products)
            .then(() => ProductCategory.model.find({})
                .exec((err, categories) => locals.categories = categories
                    .filter(b => locals.products.any(p => p.category && p.category._id == b._id)))
                .then(() => ProductSubCategory.model.find({}).populate("category")
                    .exec((err, subcategories) => locals.subcategories = subcategories
                        .filter(b => locals.products.any(p => p.subCategory && p.subCategory._id == b._id)))
                    .then(() => ProductBrand.model.find({})
                        .exec((err, brands) => locals.brands = brands
                            .filter(b => locals.products.any(p => p.brand && p.brand._id == b._id)))).then(() => {
                        view.render('sitemapXml', {layout: false}, function (err, xmlText) {
                            res.setHeader('Content-Type', 'text/xml');
                            res.send(xmlText)
                        });
                    }))));
});

router.get('/google81a0290a139b9339.html', function (req, res) {
    res.send('google-site-verification: google81a0290a139b9339.html')
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

exports = module.exports = router;
