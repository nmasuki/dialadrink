var keystone = require('keystone');
var router = keystone.express.Router();
var Order = keystone.list("Order");
var pesapalHelper = require('../../helpers/pesapal');

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

	locals.enablePaypal = process.env.PESAPAL_ENABLED;
	return view.render('checkout');
});

router.post("/", function (req, res, next) {
	if (req.body.saveInfo) { //Save option for next cashout
		req.session.userData = req.body;
		req.session.save((err, a) => {
			if (err)
				return res.send({
					state: false,
					msg: err.message
				});
		});
	}

	if (Object.keys(req.session.cart || {}).length) {
		var cart = Object.values(req.session.cart);
		var promo = req.session.promo || {};
		var subtotal = cart.sum(function (c) {
			var price = c.pieces * c.price;
			if (c.offerPrice && c.price > c.offerPrice)
				price = c.pieces * c.offerPrice
			return price;
		});
		var discount = Math.round(promo.discountType == "percent" ?
			cart.sum(c => c.pieces * c.price) * promo.discount / 100 :
			promo.discount || 0
		);

		var order = new Order.model({
			cart: cart.map(item => {
				//console.log(item)
				var cartItem = new(keystone.list("CartItem")).model({});
				
				cartItem.date = item.date;
				cartItem.state = item.state;
				cartItem.pieces = item.pieces;
				cartItem.quantity = item.quantity;
				cartItem.product = item.product;

				cartItem.save();
				return cartItem;
			}),
			paymentMethod: req.body.paymentMethod == "Cash" ? "Cash on Delivery" : req.body.paymentMethod,
			payment: {
				method: req.body.paymentMethod,
				amount: subtotal - discount
			},
			promo: req.session.promo,
			delivery: Object.assign({
				userId: req.session.userId
			}, req.body)
		});

		order.save((err) => {
			if (err)
				return next(err);

			var placeOrder = function(){
				order.placeOrder((err) => {
					if (err)
						console.warn(err);
	
					var json = {
						state: !!err,
						msg: err ? (err.msg || err.message || err) : "Order placed successfully! We will contact you shortly with details of your dispatch."
					};
	
					if (!err) {
						if (order.payment.method == "PesaPal") {
							json.redirect = pesapalHelper.getPasaPalUrl(order, req.headers.origin);
							json.msg = err ? (err.msg || err.message || err) : "Redirecting to process payment.";
						}
	
						delete req.session.promo;
						delete req.session.cart;
	
						req.session.save();
					}
	
					return res.send(json);
				});
			};

			if (order.payment.method == "PesaPal") {
				var paymentUrl = `https://www.dialadrinkkenya.com/payment/${order.orderNumber}`;
				pesapalHelper.shoternUrl(paymentUrl, function(err, shortUrl){
					order.payment.url = paymentUrl;
					if(!err)
						order.payment.shortUrl = shortUrl;
					order.save(placeOrder);
				});
			}else{
				placeOrder();
			}

		});
	} else if (req.body.saveInfo) {
		return res.send({
			state: true,
			msg: "Thanks for updating you delivery details. Next time checking out will be like a breeze!! ;)"
		});
	} else {
		return res.send({
			state: false,
			msg: "Invalid operation!"
		});
	}
});

router.get('/validatepromo/:promocode', function (req, res) {
	keystone.list("Promo").model.findOne({
			code: new RegExp(`^${req.params.promocode.trim()}$`)
		})
		.exec((err, promo) => {
			if (err)
				throw err;

			if (promo) {
				res.send({
					state: promo.status == "running",
					promo: promo.status == "running" ? (req.session.promo = promo) : null,
					msg: promo.status == "running" ?
						`Promo code '${promo.name || promo.code}' applied successfully!` : `The promo code you entered is '${promo.status.toProperCase()}'!`
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