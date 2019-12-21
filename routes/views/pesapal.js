var keystone = require('keystone');
var Payment = keystone.list("Payment");
var Order = keystone.list("Order");
var PesaPal = require('pesapaljs').init({
	key: process.env.PESAPAL_KEY,
	secret: process.env.PESAPAL_SECRET,
	debug: false, //process.env.NODE_ENV != "production" // false in production!
});

var PesaPalStatusMap = {
	"COMPLETED": "Paid",
	"PENDING": "Pending",
	"INVALID": "Cancelled",
	"FAILED": "Cancelled"
};
var router = keystone.express.Router();

router.post("/ipn", function (req, res) {
	console.log("Recieved PesaPal IPN!");
	var payment = Payment.model({});

	payment.metadata = Object.assign({}, req.body || {}, req.query || {});
	payment.save();

	Order.model.findOne({ orderNumber: payment.referenceId })
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			if (err || !order) {
				console.log("Error while reading Order id: %s", payment.referenceId, err);
				return res.status(404).render('errors/404');
			}

			var options = {
				reference: payment.referenceId,
				transaction: payment.transactionId
			};

			console.log("Reading PesaPal transaction id:" + payment.transactionId + ", ref:" + payment.referenceId)
			PesaPal.getPaymentDetails(options).then(function (data) {
					//data -> {transaction, method, status, reference}
					if (data) {
						if (data.reference)
							order.payment.referenceId = data.reference;
						if (payment.transaction)
							order.payment.transactionId = data.transaction;
						if (notificationType)
							order.payment.notificationType = payment.notificationType;

						order.payment.method = (payment.method.split("_").first() || "");
						order.payment.state = PesaPalStatusMap[data.status] || "unexpected_" + data.status;
						order.state = order.payment.state.toLowerCase();

						if (data.status == "COMPLETED")
							order.sendPaymentNotification();
						else
							console.log("PesaPal payment %s", data.status);
					}
				})
				.catch(function (error) {
					/* do stuff*/
					console.warn(error);
				});
		});

	res.send(`pesapal_notification_type=${notificationType}` +
		`&pesapal_transaction_tracking_id=${transactionId}` +
		`&pesapal_merchant_reference=${referenceId}`);
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