var keystone = require('keystone');
var router = keystone.express.Router();
var QueryOptimizer = require('../../helpers/QueryOptimizer');

function index(req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'store';
    locals.page = Object.assign({
        title: "Alcohol Delivery Nairobi | Dial A Drink Kenya - Fast, Free delivery",
        h1: "Today's Offers"
    }, locals.page || {});

    locals.page.canonical = [keystone.get('url'), ''].filter(p => p).map(p => p.trim('/')).join('/');

    if (!locals.page.bannerImages)
        locals.page.bannerImages = [];

    var homeGroupSize = process.env.HOME_GROUP_SIZE || 15;

    // Load Products - Optimized
    view.on('init', function (next) {
        // Use optimized query instead of slow offerAndPopular
        Promise.all([
            QueryOptimizer.getPopularProducts(homeGroupSize),
            QueryOptimizer.getFeaturedProducts(6)
        ]).then(([popularProducts, featuredProducts]) => {
            locals.products = popularProducts;
            locals.featuredProducts = featuredProducts;
            
            var products = popularProducts || [];                 
            var brands = products.map(p => p.brand).filter(b => !!b).distinctBy(b => b.name);
            if (brands.length == 1) locals.brand = brands.first();

            var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
            var lastRemovedKey, lastRemoved;

            // Initialize groupedBrands if not exists
            if (!locals.groupedBrands) {
                locals.groupedBrands = {};
            }

            Object.keys(locals.groupedBrands).forEach(k => {
                if (!categories.find(c => k == c.name)) {
                    lastRemovedKey = k;
                    lastRemoved = locals.groupedBrands[k];
                    //delete locals.groupedBrands[k];
                }
            });

            if (Object.keys(locals.groupedBrands).length % 2 != 0 && lastRemovedKey && lastRemoved)
                locals.groupedBrands[lastRemovedKey] = lastRemoved;
            
            //locals.groupedProducts = keystone.list('Product').groupProducts(products, homeGroupSize); 
            locals.uifilters = keystone.list('Product').getUIFilters(products || []);
            
            if (!Object.keys(locals.groupedBrands).length)
                delete locals.groupedBrands;

            next();
        });
    });

    // Render View
    view.render('products');
}

router.get("/", index);

router.get('/index.html', index);

exports = module.exports = router;
