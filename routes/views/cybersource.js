var keystone = require('keystone');
var Payment = keystone.list("Payment");
var Order = keystone.list("Order");
var CyberSourcePay = require("../../helpers/CyberSourcePay"); 

var CyberSourceStatusMap = {
	"COMPLETED": "Paid",
	"PENDING": "Pending",
	"INVALID": "Cancelled",
	"FAILED": "Cancelled",
	"DECLINE": "Cancelled",
};
var router = keystone.express.Router();

router.post("/ipn", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {})
	console.log("Recieved CyberSource IPN!", data);
	
	var payment = Payment.model({ referenceId: data.req_reference_number });
	payment.metadata = data;
	payment.save();

	Order.model.findOne({ orderNumber: payment.req_reference_number })
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			if (err || !order) {
				console.log("Error while reading Order id: %s", payment.referenceId, err);
				return res.status(404).render('errors/404');
			}

			if (data.req_reference_number)
				order.payment.referenceId = data.req_reference_number;
			if (data.transaction_id)
				order.payment.transactionId = data.transaction_id;
			if (data.notificationType)
				order.payment.notificationType = data.notificationType;
			if(payment.method)
				order.payment.method = (payment.method.split("_").first() || "");
				
			order.payment.state = CyberSourceStatusMap[data.status] || "unexpected_" + data.status;
			order.state = order.payment.state.toLowerCase();

			if (data.status == "COMPLETED")
				order.sendPaymentNotification();
			else
				console.log("CyberSource payment %s", data.status);
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