var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Order = keystone.list("Order");
var router = keystone.express.Router();

router.get("/", function (req, res) {
    var view = new keystone.View(req, res);

    // Load the current page
    view.on('init', function (next) {
        Order.model.findOne({})
            .deepPopulate('cart.product.priceOptions.option')
            .exec((err, order) => {
                if (!order)
                    return res.status(404).render('errors/404');

                if (order.cart && order.cart.length) {
                    if (order.cart.first())
                        order.currency = order.cart.first().currency;

                    order.subtotal = order.cart.sum(c => c.pieces * (c.offerPrice && c.price > c.offerPrice ? c.offerPrice : c.price));

                    order.discount = Math.round(order.promo.discountType == "percent"
                        ? order.subtotal * order.promo.discount / 100
                        : order.promo.discount
                    ) || 0;
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
