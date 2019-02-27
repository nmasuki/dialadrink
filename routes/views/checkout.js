var keystone = require('keystone');
var najax = require('najax');

var router = keystone.express.Router();
var Order = keystone.list("Order");
var PesaPal = require('pesapaljs').init({
	key: process.env.PESAPAL_KEY,
	secret: process.env.PESAPAL_SECRET,
	debug: process.env.NODE_ENV != "production" // false in production!
});

function shoternUrl(longUrl, next) {
	var googl = require('goo.gl');

	// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
	googl.setKey(process.env.GOOGLE_API_KEY1);

	// Shorten a long url and output the result
	googl.shorten(longUrl)
		.then(function (shortUrl) {
			next(null, shortUrl);
		})
		.catch(function (err) {
			next(err.message);
		});
}

function shoternUrl2(longUrl, next) {
	var url = `https://4h.net/api.php?url=${longUrl}`;
	najax.get({
		url: url,
		success: function (res) {
			if (typeof next == "function")
				next(null, res);
		},
		error: function (err) {
			next(err, url);
		}
	});
}

function shoternUrlOld(longUrl, next) {
	var url = `https://www.googleapis.com/urlshortener/v1/url?key=${process.env.GOOGLE_API_KEY1}`;
	najax.post({
		url: url,
		contentType: "application/json; charset=utf-8",
		data: {
			longUrl: longUrl
		},
		success: function (res) {
			if (typeof next == "function")
				next(null, res);
		},
		error: function (err) {
			next(err, url);
		}
	});
}

function getPasaPalUrl(order, host) {
	var customer = new PesaPal.Customer(order.delivery.email || process.env.EMAIL_FROM, order.delivery.phoneNumber);
	customer.firstName = order.delivery.firstName;
	customer.lastName = order.delivery.lastName;

	var _order = new PesaPal.Order(
		order.orderNumber,
		customer, 'Order #' + order.orderNumber,
		order.payment.amount,
		"KES", "MERCHANT"
	);

	// Redirect user to PesaPal
	var url = PesaPal.getPaymentURL(_order, host + '/pesapal/' + order.orderNumber);
	// send it to an iframe ?
	return url;
}

function getPasaPalUrl1(order, host) {
	var pesapal = require('pesapal')({
		consumerKey: process.env.PESAPAL_KEY,
		consumerSecret: process.env.PESAPAL_SECRET,
		testing: process.env.NODE_ENV != "production",
	});
	// post a direct order	   
	var postParams = {
		'oauth_callback': host + '/pesapal/' + order.orderNumber
	};

	var requestData = {
		'Type': 'MERCHANT',
		'Amount': order.payment.amount,
		'Reference': order.orderNumber,
		'Description': 'Order #' + order.orderNumber,
		'PhoneNumber': order.delivery ? order.delivery.phoneNumber : ""
	};

	var url = pesapal.postDirectOrder(postParams, requestData);
	return url;
}

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
							json.redirect = getPasaPalUrl(order, req.headers.origin);
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
				var paymentUrl = `http://${req.headers.origin}/payment/${order.orderNumber}`;
				shoternUrl2(paymentUrl, function(shortUrl){
					order.payment.url = paymentUrl;
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