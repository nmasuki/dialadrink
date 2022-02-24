var keystone = require('keystone');
var router = keystone.express.Router();
var Order = keystone.list("Order");
var pesapalHelper = require('../../helpers/PesaPal');
//var request = require('request'); //.defaults({'proxy':'http://127.0.0.1:8888'});
var najax = require('najax');

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
						.update({
							_id: s._id
						}, {
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
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.page = Object.assign({ h1: "Your Order Details" }, locals.page || {});

	locals.breadcrumbs.push({
		href: "/cart",
		label: "My Cart"
	}, {
		href: "/checkout",
		label: "Checkout"
	});

	locals.enableMPesa = !!process.env.MPESA_ENABLED;
	locals.enablePesaPal = !!process.env.PESAPAL_ENABLED;
	locals.enableCyberSource = !process.env.PESAPAL_ENABLED && !!process.env.CYBERSOURCE_ENABLED;

	getMergedCart(req, res, cart =>{
		locals.cart = cart || req.session.cart || {};
		view.render('checkout');
	});
});

router.post("/", function (req, res, next) {

	req.session.userData = req.body || {};
	req.session.save();

	if (Object.keys(req.session.cart || {}).length) {
		var promo = req.session.promo || {};
		var cartItems = Object.values(req.session.cart || {});
		var deliveryDetails = Object.assign({ clientIp: res.locals.clientIp, location: res.locals.appGeolocation }, req.body);

		var json = {
			state: true
		};

		Order.checkOutCartItems(cartItems, promo, deliveryDetails, function (err, order) {
			if (err)
				json.response = "error";


			json.msg = err ? (err.msg || err.message || err) : "Order placed successfully! We will contact you shortly with details of your dispatch."

			if (!err) {
				if (order.payment.method == "CyberSource") {
					json.redirect = "/cybersource/pay/" + order.orderNumber;
					json.message = err ? (err.msg || err.message || err) : "Redirecting to process payment.";
				} else if (order.payment.method == "PesaPal") {
					json.redirect = pesapalHelper.getPesaPalUrl(order, req.headers.origin);
					json.msg = err ? (err.msg || err.message || err) : "Redirecting to process payment.";
				} else if (order.payment.method == "Mpesa") {
					json.msg = "Processing payment. Please check your mobile handsets to complete the transaction.";
					var mpesa = require('../../helpers/mpesa');

					mpesa.onlineCheckout(
						order.delivery.phoneNumber,
						order.payment.amount,
						order.orderNumber
					);
				} else if (order.payment.method == "Mpesa2") {
					json.msg = "Processing payment. Please check your mobile handsets to complete the transaction.";
					var africasTalking = require('../helpers/AfricasTalking').Instance;

					africasTalking.processPayment(
						order.delivery.phoneNumber, order.orderNumber,
						order.orderNumber, order.payment.amount, 'KES'
					);
				}

				order.cart = cartItems;
				
				//OKHi intergration
				if (process.env.OKHI_KEY && req.body.user && req.body.location)
					okHiIntegration(req, res, order, cartItems);

				delete req.session.cart;
				req.session.save();
			}

			return res.send(json);
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
						`Promo code '${promo.name || promo.code}' applied successfully!` :
						`The promo code you have entered is '${promo.status.toProperCase()}'!`
				});
			} else {
				res.send({
					state: false,
					msg: "Invalid promo code!! <br>Head over to <a href='/'>Today&apos;s Offers</a> for reduced prices"
				});
			}
		});
});

function okHiIntegration(req, res, order, cartItems, next) {
	var url = process.env.NODE_ENV == "production" 
		? "https://api.okhi.io/v5/interactions" 
		: "https://sandbox-api.okhi.io/v5/interactions";

	var user = {
		"phone": req.body.user.phone,
		"first_name": req.body.user.firstName,
		"last_name": req.body.user.lastName
	};

	var location = Object.assign({
		"street_name": req.body.location.streetName
	})

	var data = {
		user: user,
		value: order.payment.amount,
		id: order.orderNumber.toString(),
		use_case: "e-commerce",
		location_id: req.body.location.id,
		location: location,
		properties: {
			send_to_queue: true,
			payment_method: (order.payment.method || "cash").toString().toLowerCase(),
			brand: "dialadrink",
			location: "cbd",
			currency: "KES",

			basket: cartItems.map(c => {
				var item = {
					"sku": c.product._id,
					"value": c.product.price,
					"name": c.product.name,
					"description": c.product.description,
					"category": c.product.category ? c.product.category.name || c.product.category : "alcohol",
					"quantity": c.pieces
				};
				
				return item;
			}),

			shipping: {
				"cost": 0,
				"class": "Flat rate",
				"expected_delivery_date": order.orderDate.addMinutes(30)
			}
		}
	};

	console.log("Calling OKHI api:", url, res.locals.OkHiServerKey);
	var key = "Token " + Buffer.from(res.locals.OkHiBranch + ":" + res.locals.OkHiServerKey).toString('base64');

	najax.post({
		url: url,
		contentType: "application/json; charset=utf-8",
		headers: { "Authorization": key },
		data: data,
		rejectUnauthorized: false,
		requestCert: true,
		agent: false,
		success: function (res) {
			console.log("OKHI api res:", res);
			if (typeof next == "function")
				next(null, res);
		},
		error: function (xhr, status, err) {
			console.error("Error calling OKHI api!", status, xhr.responseText, err);
			if (typeof next == "function")
				next(err, url);
		}
	});
}

exports = module.exports = router;