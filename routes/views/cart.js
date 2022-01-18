var keystone = require('keystone');
var router = keystone.express.Router();

function getMergedCart(req, res, callback) {
	var client = res.locals.appUser;
	if (!client)
		return callback(new Error("We could not resolve the logged in user!"));

	var carts = [{}];
	client.getSessions(function (err, sessions) {
		const db = keystone.mongoose.connection;

		sessions.forEach(s => {
			if (Object.keys(s.cart || {}).length) {
				carts.push(s.cart);
				if (s._id != req.sessionID) {
					delete s.cart;
					db.collection('app_sessions')
						.update({ _id: s._id }, {
							$set: {
								session: JSON.stringify(s)
							}
						});
				}
			}
		});

		var cart = Object.assign.apply(this, carts);
		req.session.cart = cart;

		if (typeof callback == "function")
			callback(null, cart);
	});
}

router.get('/', function (req, res) {
	getMergedCart(req, res, cart => {
		res.locals.cart = cart || req.session.cart || {};

		res.locals.breadcrumbs.push({
			label: "My Cart",
			href: req.originalUrl
		});

		return res.render('cart');
	});
	
});

router.get('/mini', function (req, res) {
	getMergedCart(req, res, cart => {
		res.locals.cart = cart || req.session.cart || {};
		return res.render("cart-mini", {layout: false});
	});
});

exports = module.exports = router;
