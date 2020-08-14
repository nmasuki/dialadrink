var keystone = require('keystone');
var Payment = keystone.list("Payment");
var Order = keystone.list("Order");
var CyberSourcePay = require("../../helpers/CyberSourcePay"); 

var PesaPalStatusMap = {
	"COMPLETED": "Paid",
	"PENDING": "Pending",
	"INVALID": "Cancelled",
	"FAILED": "Cancelled"
};
var router = keystone.express.Router();

router.post("/ipn", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {})
	console.log("Recieved PesaPal IPN!", data);
	
	var payment = Payment.model({ referenceId: data.reference_number });
	payment.metadata = data;
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

router.get("/pay/:orderNo", function (req, res){	
	var view = new keystone.View(req, res);
	
	Order.model.findOne({ orderNumber: req.params.orderNo })
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			
			if (!order)
				return res.status(404).render('errors/404');			
			
			res.locals.page.h1 = "Payment";
			
			var data = CyberSourcePay.getPostData(order);
			res.locals.paymentUrl = data.paymentUrl;
			res.locals.signature = data.signature;

			delete data.paymentUrl;
			delete data.signature;

			res.locals.data = data;

			view.render('cybersource', {layout: 'payment'});			
		});
});

exports = module.exports = router;