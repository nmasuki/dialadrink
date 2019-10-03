var keystone = require('keystone');
var Order = keystone.list("Order");
var Product = keystone.list("Product");
var CartItem = keystone.list("CartItem");

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
            json.order = order.toObject({ virtuals: true });

            if (order.cart && order.cart.length)
                json.order.cart = order.cart.map(c => c.toObject({
                    virtuals: true
                }));

            if (json.order.cart.first())
                json.order.currency = order.cart.first().currency;

            return res.send(json);
        });
});

router.post("/", function (req, res){
    var client = res.locals.appUser;
    var json = { 
        response: "error",
        message: 'Error updating user',
        data: {}
    };

    if (client) {
        client.copyAppObject(req.body);
        client.save(function (err) {
            if (err) {
                json.data = err;                
                return res.send(json);
            }
                        
            json.response = "success";
            var cartItems = getCartItems(req);
            var promo = req.session.promo || {};
            var deliveryDetails = Object.assign({clientIp: res.locals && res.locals.clientIp}, client.toObject());	

            Order.checkOutCartItems(cartItems, promo, deliveryDetails, function(err, order){
                if (err)
                    json.response = "error";

                json.message = err ? (err.msg || err.message || err) : "Order placed successfully! We will contact you shortly with details of your dispatch."

                if (!err) {
                    if (order.payment.method == "PesaPal") {
                        json.redirect = pesapalHelper.getPasaPalUrl(order, req.headers.origin);
                        json.message = err ? (err.msg || err.message || err) : "Redirecting to process payment.";
                    } else if (order.payment.method == "Mpesa") {
                        json.message = "Processing payment. Please check your mobile handsets to complete the transaction.";
                        var mpesa = require('../../helpers/mpesa');
                        
                        mpesa.onlineCheckout(
                            order.delivery.phoneNumber,
                            order.payment.amount, 
                            order.orderNumber
                        );
                    } else if (order.payment.method == "Mpesa2") {
                        json.message = "Processing payment. Please check your mobile handsets to complete the transaction.";
                        var africasTalking = require('../helpers/AfricasTalking').Instance;

                        africasTalking.processPayment(
                            order.delivery.phoneNumber, order.orderNumber, 
                            order.orderNumber, order.payment.amount, 'KES'
                        );
                    }
                }

                return res.send(json);
            });
        
        });
    }
});

function getCartItems(req){
    var cartItems = req.body.item_id.map((id, i) => {
        var cart = new CartItem.model({
            _id: `${req.body.item_id[i]}|${req.body.item_opt[i]}`,
            product: req.body.item_id[i],
            price: req.body.item_price[i],
            quantity: req.body.item_opt[i],
            pieces: req.body.item_pieces[i]
        });

        Product.findOnePublished({_id: cart.product})
            .exec((err, product) => {
                if (err || !product)
                    return console.warn(`Error while processing App order item:${id}. ${err}`);
                //popularity goes up 10x
                product.addPopularity(10);
            });

        return cart;
    });

    return cartItems;
}
module.exports = router;