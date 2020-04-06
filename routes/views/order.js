var keystone = require('keystone');
var Order = keystone.list("Order");
var router = keystone.express.Router();

router.get("/:orderNo", function (req, res) {
    var view = new keystone.View(req, res);
    Order.model.findOne({orderNumber: req.params.orderNo})
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
            if (!order)
                return res.status(404).render('errors/404');

            var locals = res.locals;
            order.total = order.subtotal - (order.discount || 0);
            locals.order = order.toObject({virtuals: true});

            if (order.cart && order.cart.length)
                locals.order.cart = order.cart.map(c => c.toObject({virtuals: true}));            
            if (locals.order.cart.first())
                locals.order.currency = order.cart.first().currency;
                
            if (locals.page){
                view.render('order');
            } else
                res.status(404).render('errors\\404');
        });
});

module.exports = router;
