var keystone = require('keystone');
var router = keystone.express.Router();
var Order = keystone.list("Order");
var pesapalHelper = require('../../helpers/pesapal');
var request = require('request');//.defaults({'proxy':'http://127.0.0.1:8888'});
var najax = require('najax');

router.get('/', function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.cart = req.session.cart || {};
	locals.page = Object.assign(locals.page, {
		h1: "Your Order Details"
	});

	if(locals.userData && locals.userData.show)
		locals.userData = req.session.userData;
		
	locals.breadcrumbs.push({
		href: "/cart",
		label: "My Cart"
	}, {
		href: "/checkout",
		label: "Checkout"
	});

	locals.enableMPesa = process.env.MPESA_ENABLED;
	locals.enablePaypal = process.env.PESAPAL_ENABLED;
	return view.render('checkout');
});

router.post("/", function (req, res, next) {

	req.session.userData = req.body || {};
	req.session.userData.show = !!req.body.saveInfo;
	req.session.save();

	if (Object.keys(req.session.cart || {}).length) {
		var promo = req.session.promo || {};		
		var cartItems = Object.values(req.session.cart || {});
		var deliveryDetails = Object.assign({clientIp: res.locals.clientIp}, req.body);

		var json = {
			state: true
		};

		Order.checkOutCartItems(cartItems, promo, deliveryDetails, function(err, order){
			if (err)
				json.response = "error";

			if(order.client.sessions.indexOf(req.sessionID) < 0){
				order.client.sessions.push(req.sessionID);
				order.client.save();
			}

			json.msg = err ? (err.msg || err.message || err) : "Order placed successfully! We will contact you shortly with details of your dispatch."

			if (!err) {
				if (order.payment.method == "PesaPal") {
					json.redirect = pesapalHelper.getPasaPalUrl(order, req.headers.origin);
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
				if(process.env.OKHI_KEY && req.body.user && req.body.location)
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
					msg: promo.status == "running" 
						?`Promo code '${promo.name || promo.code}' applied successfully!` 
						:`The promo code you have entered is '${promo.status.toProperCase()}'!`
				});
			} else {
				res.send({
					state: false,
					msg: "Invalid promo code!! <br>Head over to <a href='/'>Today&apos;s Offers</a> for reduced prices"
				});
			}
		});
});

function okHiIntegration(req, res, order, cartItems, next){
	var url = res.locals.OkHiEnv == "prod"
		? "https://server.okhi.co/v1/interactions"
		: "https://sandbox-server.okhi.dev/v1/interactions";

	var data = {
		id: order.orderNumber,
		useCase: "e-commerce",
		locationId: req.body.location.id,
		value: order.payment.amount,
		user: req.body.user,
		properties: {
			brand: "dialadrink",
			branch: "cbd",
			paymentMethod: (order.payment.method || "cash"),
			sendToQueue: true,
			currency: "KES",
			basket: cartItems.map(c => {
				var item = {
					"sku": c.product._id,
					"value": c.product.price,
					"name": c.product.name,
					"description": c.product.description,
					"category": c.product.category? c.product.category.name || c.product.category: "alcohol",
					"quantity": c.pieces
				};
				return item;
			})
		},
		shipping: {
			"cost": 0,
			"class": "Flat rate",
			"expectedDeliveryDate": order.orderDate.addMinutes(30)
		}
	};

	console.log("Calling OKHI api:", res.locals.OkHiKey, url);
	najax.post({
		url: url,
		contentType: "application/json; charset=utf-8",
		headers: { "api-key": res.locals.OkHiKey },
		data: data,
		success: function (res) {
			console.log(res);
			if (typeof next == "function")
				next(null, res);
		},
		error: function (xhr, status, err) {			
			console.log("Error while making Okhi API call!", status, xhr.responseText, err);
			if (typeof next == "function")
				next(err, url);
		}
	});
}

exports = module.exports = router;
