var keystone = require('keystone');
var router = keystone.express.Router();
var Order = keystone.list("Order");

router.get('/', function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.cart = req.session.cart || {};
	locals.page = Object.assign(locals.page, {
		h1: "Your Order Details"
	});

	locals.userData = req.session.userData;
	locals.breadcrumbs.push({
		href: "/cart",
		label: "My Cart"
	}, {
		href: "/checkout",
		label: "Checkout"
	});

	return view.render('checkout');
});

router.post("/", function (req, res) {
	if (req.body.saveInfo) {//Save option for next cashout
		req.session.userData = req.body;
		req.session.save((err, a) => {
			if (err)
				return res.send({state: false, msg: err.message})
		});
	}

	if (Object.keys(req.session.cart || {}).length) {
		var order = new Order.model({
			cart: Object.values(req.session.cart).map(item => {
				//console.log(item)
				var cartItem = new (keystone.list("CartItem")).model({
					date: item.date,
					pieces: item.pieces,
					state: item.state,
					product: item.product,
					quantity: item.quantity
				});
				cartItem.save();
				return cartItem;
			}),
			promo: req.session.promo,
			delivery: Object.assign({userId: req.session.userId}, req.body)
		});

		order.save((err) => {
			if (err)
				console.warn(err);

			order.placeOrder((err) => {
				if (err)
					console.log(err);

				if (!err) {
					delete req.session.promo;
					delete req.session.cart;

					req.session.save();
				}

				return res.send({
					state: !!err,
					msg: err ? err.msg || err.message || err : "Order placed successfully! We will contact you shortly with details of your dispatch."
				});
			});
		})

	} else if (req.body.saveInfo) {
		return res.send({
			state: true,
			msg: "Thanks for updating you delivery details. Next time checking out will be like a breeze!! ;)"
		});
	} else {
		return res.send({state: false, msg: "Invalid operation!"});
	}
});

router.get('/validatepromo/:promocode', function (req, res) {
	keystone.list("Promo").model.findOne({code: new RegExp(`^${req.params.promocode.trim()}$`)})
		.exec((err, promo) => {
			if (err)
				throw err;

			if (promo) {
				res.send({
					state: promo.status == "running",
					promo: promo.status == "running" ? (req.session.promo = promo) : null,
					msg: promo.status == "running"
						? `Promo code '${promo.name || promo.code}' applied successfully!`
						: `The promo code you entered is '${promo.status.toProperCase()}'!`
				});
			} else {
				res.send({
					state: false,
					msg: "Invalid promo code!! <br>Head over to <a href='/'>Today&apos;s Offers</a> for reduced prices"
				})
			}
		});
});

exports = module.exports = router;
