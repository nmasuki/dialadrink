var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Order = keystone.list("Order");
var router = keystone.express.Router();

router.get("/ipn", function (req, res){
    var payment = req.payment;
    if(payment){
        console.log("IPN received!", req.body);
    }else{
        console.log("IPN no!", req.body);
    }
});

router.get("/:orderNo", function (req, res) {
    var view = new keystone.View(req, res);

    // Load the current page
    view.on('init', function (next) {
        var locals = res.locals;
        if (!locals.page)
            return res.status(404).render('errors\\404');

        Order.model.findOne({orderNumber: req.params.orderNo})
            .deepPopulate('cart.product.priceOptions.option')
            .exec((err, order) => {
                if (!order)
                    return res.status(404).render('errors/404');
                
                if(!order.payment.method){
                    order.payment.method = order.payment.method || "Paypal";
                    order.payment.amount = order.payment.amount || order.total;
                }

                [req.body, req.query].forEach(payload=>{
                    var paymentIdKey = Object.keys(payload || {}).find(k=>k.toLowerCase().contains("id"));
                    if(paymentIdKey)
                        order.payment.paymentId = payload[paymentIdKey];
                });

                order.state = "paid";
                order.save();   

                locals.order = order.toObject({virtuals: true});
                locals.order.total = locals.order.total || order.subtotal - (order.discount || 0);
                locals.order.cart = order.cart.map(c => c.toObject({virtuals: true}));
                
                if (locals.order.cart && locals.order.cart.length) {
                    if (locals.order.cart.first())
                        locals.order.currency = locals.order.cart.first().currency;
                }
                
                order.sendPaymentNotification(function(){
                    order.payment.notificationSent = true;
                    order.save();
                });

                delete locals.groupedBrands;    
                next(err);
            });
    });
 
    // Render the view
    view.render('receipt');
});

exports = module.exports = router;
