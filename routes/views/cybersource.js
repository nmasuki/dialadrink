var keystone = require('keystone');
var Payment = keystone.list("Payment");
var Order = keystone.list("Order");

var sms = require("../../helpers/sms").getInstance();
var CyberSourcePay = require("../../helpers/CyberSourcePay"); 

var CyberSourceStatusMap = {
	"COMPLETED": "Paid",
	"PENDING": "Pending",
	"INVALID": "Cancelled",
	"FAILED": "Cancelled",
	"DECLINE": "Cancelled",
	"ERROR": "Cancelled"
};
var router = keystone.express.Router();

router.post("/ipn", function (req, res) {
	var data = Object.assign({}, req.body || {}, req.query || {})
	console.log("Recieved CyberSource IPN!", data);
	
	var payment = Payment.model({ 
		transactionId: data.transaction_id,
		referenceId: data.req_reference_number,
		status: data.decision,		
		amount: data.req_amount,
		currency: data.req_currency
	});
	payment.metadata = data;
	payment.save();

	Order.model.findOne({ orderNumber: payment.referenceId })
		.deepPopulate('cart.product.priceOptions.option')
		.populate('client')
		.exec((err, order) => {
			if (err || !order) {
				console.log("Error while reading Order id: %s", payment.referenceId, err);
				if(err)
					return res.status(404).render('errors/404');
			}

			if(order){
				if (data.req_reference_number)
					order.payment.referenceId = data.req_reference_number;
				if (data.transaction_id)
					order.payment.transactionId = data.transaction_id;
				if (data.notificationType)
					order.payment.notificationType = data.notificationType;				
				if(payment.method)
					order.payment.method = (payment.method.split("_").first() || "");
					
				order.payment.state = CyberSourceStatusMap[data.decision] || "unexpected_" + data.decision;
				order.state = order.payment.state.toLowerCase();

				if (order.payment.state == "Paid")
					order.sendPaymentNotification();

				order.save();
			}
			
			console.log("CyberSource payment %s, %s", data.decision, data.message);
			var vendorNumber = (process.env.CONTACT_PHONE_NUMBER || "254723688108").cleanPhoneNumber();
			var message = `COOP ${data.req_payment_method} payment ${data.decision}, ${data.message}. ` +
			`Order: ${data.req_reference_number} by ${data.req_bill_to_forename} ${data.req_bill_to_surname}, ` + 
			`Amount: ${data.req_currency}${data.req_amount}`;
			
			sms.sendSMS(vendorNumber, message);
			res.send(`OK!`);
		});
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