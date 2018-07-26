var keystone = require('keystone');
var router = keystone.express.Router();

function index(req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'store';
	locals.page = Object.assign(locals.page, {
		title: "Alcohol Delivery Nairobi | Dial A Drink Kenya - Fast, Free delivery",
		h1: "Today's Offers"
	});

    locals.page.canonical = '/index.html';
	if (!locals.page.bannerImages)
		locals.page.bannerImages = [
			"/assets/twall.jpg", "/assets/twall1.jpg", "/assets/twall2.jpg",
			"/assets/twall3.jpg", "/assets/twall4.jpg"
		];

	// Load Products
	view.on('init', function (next) {
		keystone.list('Product').findPublished({onOffer: true, state: 'published'}, (err, products) => {
			locals.products = products;
			next();
		});
	});

	// Render View
	view.render('products');
}

router.get("/", index);

router.get('/index.html', index);

exports = module.exports = router;
