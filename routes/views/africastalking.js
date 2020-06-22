var keystone = require('keystone');
var Order = keystone.list("Order");
var Payment = keystone.list("Payment");
var AfricasTalking = require('../../helpers/sms').africasTalking;
var ls = require('../../helpers/LocalStorage').getInstance("atsms");

var PesaPalStatusMap = {
	"COMPLETED": "Paid",
	"PENDING": "Pending",
	"INVALID": "Cancelled",
	"FAILED": "Cancelled"
};
var router = keystone.express.Router();

router.post("/deliveryreport", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {});
	console.log("Received %s", req.url, data);

	var record = ls.getAll({ "massages.messageId": data.id })[0];
		
	if (record) {
		var m = (record.massages || []).find(r => r.messageId);
		(m.activities || (m.activities = [])).push(data);
		m.status = data.status;

		var status = record.massages.map(r => r.status).distinct();
		record.status = status.length > 1
			? status.map(s => "Partial_" + s).join("; ")
			: status[0] || record.status;

	} else {
		record = {
			to: [data.phoneNumber],
			info: "Untracked deliveryreport",
			data: data
		};
	}

	ls.save(record);
	res.status(200);

});

router.post("/optout", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {});
	console.log("Received %s", req.url, data);
	res.status(200);
});

router.post("/incomingsmsnotification", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {});
	console.log("Received %s", req.url, data);
	res.status(200);
});

router.post("/optoutsmsnotification", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {});	
	console.log("Received %s", req.url, data);
	res.status(200);
});


router.post("/paymentvalidation", function (req, res) {
	var payment = Payment.model({});

	payment.metadata = Object.assign({}, req.body || {}, req.query || {});
	payment.save();

	Order.model.findOne({ orderNumber: payment.metadata.orderNumber })
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			if (err || !order) {
				console.log("Error while reading Order id:", payment.metadata.orderNumber);
				return res.status(400);
			}

			res.status(200);
		});
});

router.post("/paymentnotification", function (req, res) {
	var payment = Payment.model({});

	payment.metadata = Object.assign({}, req.body || {}, req.query || {});
	payment.save();

	console.log("Recieved AfricasTalking IPN!", payment.metadata);
	Order.model.findOne({ orderNumber: payment.metadata.orderNumber })
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			if (!order) {
				console.log("Error while reading Order id:", payment.metadata.orderNumber);
				return res.status(200);
			}

			console.log("Reading AfricasTalking transaction id:" + payment.transactionId + ", ref:" + payment.referenceId)
			AfricasTalking.getPaymentDetails(payment.transactionId).then(function (response) {
					var data = response.data;
					res.status(data ? 200 : 400);

					if (data) {
						if (data.reference)
							order.payment.referenceId = data.reference;
						if (payment.transaction)
							order.payment.transactionId = data.transaction;
						if (notificationType)
							order.payment.notificationType = payment.notificationType;

						order.payment.method = (data.method.split("_").first() || "");
						order.payment.state = PesaPalStatusMap[data.status] || "unexpected_" + data.status;
						order.state = order.payment.state.toLowerCase();

						if (data.status == "COMPLETED")
							order.sendPaymentNotification();
						else
							console.log("PesaPal payment %s", data.status);
					}
				})
				.catch(function (error) {
					res.status(400);
					console.warn(error);
				});
		});

});

router.get("/:orderNo", function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	function showReceipt(err, order) {
		locals.order = order.toObject({
			virtuals: true
		});
		locals.order.total = locals.order.total || order.subtotal - (order.discount || 0);
		locals.order.cart = order.cart.map(c => c.toObject({
			virtuals: true
		}));

		if (locals.order.cart && locals.order.cart.length) {
			if (locals.order.cart.first())
				locals.order.currency = locals.order.cart.first().currency;
		}

		delete locals.groupedBrands;

		// Render the view
		view.render('receipt');
	}

	function showPendingPayment(err, order) {
		showReceipt(err, order);
	}

	if (!locals.page)
		return res.status(404).render('errors\\404');

	Order.model.findOne({
			orderNumber: req.params.orderNo
		})
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			if (!order)
				return res.status(404).render('errors/404');

			[req.body, req.query].forEach(payload => {
				var transactionIdKey = Object.keys(payload || {}).find(k => k.toLowerCase().contains("transaction"));
				var referenceIdKey = Object.keys(payload || {}).find(k => k.toLowerCase().contains("reference"));
				if (transactionIdKey)
					order.payment.transactionId = payload[transactionIdKey];
				if (referenceIdKey)
					order.payment.referenceId = payload[referenceIdKey];
			});

			var options = {
				reference: order.payment.referenceId || order.orderNumber,
				transaction: order.payment.transactionId
			};

			PesaPal.getPaymentDetails(options).then(function (payment) {
					//payment -> {transaction, method, status, reference}
					console.log(payment);

					if (payment) {
						order.payment.referenceId = payment.reference;
						order.payment.transactionId = payment.transaction;
						order.payment.method = (payment.method.split("_").first() || "");
						order.payment.state = PesaPalStatusMap[payment.status] || "unexpected_" + payment.status;
						order.state = order.payment.state.toLowerCase();
					}

					if (payment.status == "COMPLETED") {
						order.sendPaymentNotification(function () {
							showReceipt(null, order);
						});
					} else {
						order.save();
						showPendingPayment(null, order);
					}
				})
				.catch(function (error) {
					/* do stuff*/
					console.warn(error);
				});
		});
});

exports = module.exports = router;