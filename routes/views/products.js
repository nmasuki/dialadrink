var keystone = require('keystone');
var router = keystone.express.Router();

function index(req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'store';
    locals.page = Object.assign({
        title: "Alcohol Delivery Nairobi | Dial A Drink Kenya - Fast, Free delivery",
        h1: "Today's Offers"
    }, locals.page || {});

    locals.page.canonical = [keystone.get('url'), 'index.html']
        .filter(p => p).map(p => p.trim('/')).join('/');
    if (!locals.page.bannerImages)
        locals.page.bannerImages = [];

    var homeGroupSize = process.env.HOME_GROUP_SIZE || 12;

    // Load Products
    view.on('init', function (next) {
        keystone.list('Product').offerAndPopular(homeGroupSize, (err, data) => {
            locals.popular = data.popular;
            locals.offers = data.offers;

            var products = data.offers.concat(data.popular);            
            var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
            if (brands.length == 1) locals.brand = brands.first();

            var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
            var lastRemovedKey, lastRemoved;

            Object.keys(res.locals.groupedBrands).forEach(k => {
                if (!categories.find(c => k == c.name)) {
                    lastRemovedKey = k;
                    lastRemoved = res.locals.groupedBrands[k];
                    //delete res.locals.groupedBrands[k];
                }
            });

            if (Object.keys(res.locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                res.locals.groupedBrands[lastRemovedKey] = lastRemoved;

            res.locals.uifilters = keystone.list('Product').getUIFilters(products);
            if (!Object.keys(res.locals.groupedBrands).length)
                delete res.locals.groupedBrands;

            next();
        });
    });

    // Render View
    view.render('products');
}

router.get("/", index);

router.get('/index.html', index);

exports = module.exports = router;