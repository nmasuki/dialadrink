var keystone = require('keystone');
var router = keystone.express.Router();

router.get('/', function (req, res) {
	var view = new keystone.View(req, res);
	res.locals.cart = req.session.cart || {};

	res.locals.breadcrumbs.push({
		label: "My Cart",
		href: req.originalUrl
	});

	return res.render('cart');
});

router.get('/mini', function (req, res) {
	res.locals.cart = req.session.cart || {};
	return res.render("cart-mini", {layout: false});
});

exports = module.exports = router;
