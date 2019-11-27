var keystone = require('keystone');
var Order = keystone.list("Order");
var Product = keystone.list("Product");
var CartItem = keystone.list("CartItem");

var pesapalHelper = require('../../helpers/pesapal');
var router = keystone.express.Router();

router.get("/", function(req, res){
    var client = res.locals.appUser;
    var json = { 
        response: "error",
        message: 'Error getting user Orders.',
        data: []
    };

    var phoneNos = [client.phoneNumber.cleanPhoneNumber(), client.phoneNumber.cleanPhoneNumber().replace(/\+?245/, "0")];
    Order.model.find({'delivery.phoneNumber':{ $in:phoneNos}})
        .deepPopulate('cart')
        .exec((err, orders)=>{
            if (err)
                json.message += "! " + err;
            else{
                json.data = orders.orderByDescending(o => o.orderDate).map(o => o.toObject());
            }
            
            return res.send(json);
        });
});

router.post("/", function (req, res){
    var client = res.locals.appUser;
    var json = { 
        response: "error",
        message: 'Error while placing Order!',
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
            var deliveryDetails = Object.assign({}, client.toObject(), req.body, {clientIp: res.locals && res.locals.clientIp});	

            Order.checkOutCartItems(cartItems, promo, deliveryDetails, function(err, order){
                if (err)
                    json.response = "error";

                json.data = order.toObject();
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

router.get("/:orderNo", function (req, res) {
    var json = {
        response: "error",
        message: "Error while getting order #" + req.params.orderNo,
        data: {}
    };

    Order.model.findOne({$or:[{orderNumber: req.params.orderNo},{_id:req.params.orderNo}] })
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
            if (err)
                json.message += "! " + err;
            else if(!order)
                json.message += "! No matching order Number";
            else{
                json.data = order.toObject();
            }
            return res.send(json);
        });
});


function getCartItems(req){
    var items = [];
    if(typeof req.body.item_id == "string")
    {
        items.push({
            _id: `${req.body.item_id}|${req.body.item_opt}`,
            product: req.body.item_id,
            price: req.body.item_price,
            quantity: req.body.item_opt,
            pieces: req.body.item_pieces
        });
    }
    else{
        for(var i =0; i < req.body.item_id.length; i++){
            items.push({
                _id: `${req.body.item_id[i]}|${req.body.item_opt[i]}`,
                product: req.body.item_id[i],
                price: req.body.item_price[i],
                quantity: req.body.item_opt[i],
                pieces: req.body.item_pieces[i]
            });
        }
    }
        

    var cartItems = items.map((item, i) => {
        var cart = new CartItem.model(item);
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