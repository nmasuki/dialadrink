var keystone = require('keystone');
var Order = keystone.list("Order");

var router = keystone.express.Router();

router.get("/:orderNo", function (req, res) {

    Order.model.findOne({orderNumber: req.params.orderNo })
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
            if (!order)
                return res.status(404).render('errors/404');

            var json = {
                response: "error",
                data: {}
            };

            order.total = order.subtotal - (order.discount || 0);
            json.order = order.toObject({
                virtuals: true
            });

            if (order.cart && order.cart.length)
                json.order.cart = order.cart.map(c => c.toObject({
                    virtuals: true
                }));

            if (json.order.cart.first())
                json.order.currency = order.cart.first().currency;

            return res.send(json);
        });
});


module.exports = router;