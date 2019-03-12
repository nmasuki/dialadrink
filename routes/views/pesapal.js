var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Order = keystone.list("Order");
var PesaPal = require('pesapaljs').init({
	key: process.env.PESAPAL_KEY,
	secret: process.env.PESAPAL_SECRET,
	debug: false, //process.env.NODE_ENV != "production" // false in production!
});

var PesaPalStatusMap = {"COMPLETED": "Paid", "PENDING": "Pending", "INVALID": "Cancelled", "FAILED": "Cancelled" };
var router = keystone.express.Router();

router.get("/ipn", function (req, res) {
	console.log("Recieved Pasapal IPN!")
    var transactionId = "", referenceId = "", notificationType = "";
    [req.body, req.query].forEach(payload => {
		console.log("IPN payload:", payload);

        var payloadKeys = Object.keys(payload || {});
        var transactionIdKey = payloadKeys.find(k => k.toLowerCase().contains("transaction"));
        var referenceIdKey   = payloadKeys.find(k => k.toLowerCase().contains("reference") || k.toLowerCase().contains("reciept"));
        var notificationTypeKey = payloadKeys.find(k => k.toLowerCase().contains("notification"));
        
        if (transactionIdKey)
            transactionId = transactionId || payload[transactionIdKey];
        if (referenceIdKey)
            referenceId = referenceId || payload[referenceIdKey];
        if (notificationTypeKey)
            notificationType = notificationType || payload[notificationTypeKey];
    });

	Order.model.findOne({ orderNumber: referenceId })
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
            if (!order){
				console.log("Error while reading Order id:", referenceId);
                return res.status(404).render('errors/404');
			}
                
            var options = {
                reference: referenceId,
                transaction: transactionId
            };

			console.log("Reading Pasapal transaction id:" + transactionId + ", ref:" + referenceId)
            PesaPal.getPaymentDetails(options).then(function (payment) {
                //payment -> {transaction, method, status, reference}
                //console.log(payment);

                if (payment) {
					if(payment.reference)
                    	order.payment.referenceId = payment.reference;
					if(payment.transaction)
                    	order.payment.transactionId = payment.transaction;
					if(notificationType)
                    	order.payment.notificationType = notificationType;

					order.payment.method = (payment.method.split("_").first()||"");
                    order.payment.state = PesaPalStatusMap[payment.status] || "unexpected_" + payment.status;
                    order.state = order.payment.state.toLowerCase();
                }

                if (payment.status == "COMPLETED") {
                    order.sendPaymentNotification(function (err) {
                        order.payment.notificationSent = !!err;
                        order.save();
                    });
                } else {
					order.payment.notificationSent = false;
                    order.save();
				}
            })
            .catch (function (error) {
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
        locals.order = order.toObject({ virtuals: true });
        locals.order.total = locals.order.total || order.subtotal - (order.discount || 0);
		locals.order.cart = order.cart.map(c => c.toObject({ virtuals: true }));

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
	.exec((err, order) => {
		if (!order)
			return res.status(404).render('errors/404');
            
		[req.body, req.query].forEach(payload => {
			var transactionIdKey = Object.keys(payload || {}).find(k => k.toLowerCase().contains("transaction"));
			var referenceIdKey   = Object.keys(payload || {}).find(k => k.toLowerCase().contains("reference"));
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
				order.payment.method = (payment.method.split("_").first()||"");
				order.payment.state = PesaPalStatusMap[payment.status] || "unexpected_" + payment.status;
				order.state = order.payment.state.toLowerCase();
			}

			if (payment.status == "COMPLETED") {
				order.sendPaymentNotification(function () {
					order.payment.notificationSent = true;
					order.save();
					showReceipt(null, order);
				});
			} else {
				order.save();
				showPendingPayment(null, order);
			}
		})
		.catch (function (error) {
			/* do stuff*/
			console.warn(error);
		});
	});
});

exports = module.exports = router;