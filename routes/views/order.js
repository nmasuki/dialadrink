var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Order = keystone.list("Order");
var router = keystone.express.Router();


router.get("/:orderNo", function (req, res) {
    var view = new keystone.View(req, res);

    // Load the current page
    view.on('init', function (next) {
        Order.model.findOne({orderNumber: req.params.orderNo})
            .deepPopulate('cart.product.priceOptions.option')
            .exec((err, order) => {
                if (!order)
                    return res.status(404).render('errors/404');

                if (order.cart && order.cart.length) {
                    if (order.cart.first())
                        order.currency = order.cart.first().currency;

                    var payment = req.payment;
                    if(payment){
                        order.status = "paid";
                        order.sendPaymentNotification();
                    }
                }

                order.total = order.subtotal - (order.discount || 0);
                var locals = res.locals;
                locals.order = order.toObject({virtuals: true});
                locals.order.cart = order.cart.map(c => c.toObject({virtuals: true}));

                if (locals.page)
                    next();
                else
                    res.status(404).render('errors\\404');
            });
    });
 
    // Render the view
    view.render('../email/order', {layout: 'email'});
});

exports = module.exports = router;
