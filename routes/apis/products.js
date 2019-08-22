var keystone = require('keystone');
var Product = keystone.list("Product");

var router = keystone.express.Router();

router.get("/", function (req, res) {
    var since = new Date(req.query.since || '2015-01-01')

    Product.findPublished({modifiedDate: { $gt: since}}, function (err, products) {
        if (err)
            return res.send("error fetching drinks");

        res.send(products.map(d => {
            var obj = Object.assign({}, d.toObject(), {
                url: 'https://www.dialadrinkkenya.com/' + d.href,
                image: d.image.secure_url,
                images: d.altImages ? d.altImages.map(a => a && a.secure_url) : [],
                category: d.category ? d.category.name : null,
                categories: d.onOffer ? (d.category ? [d.category.name, "offer"] : ["offer"]) : d.category ? [d.category.name] : [],
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

module.exports = router;