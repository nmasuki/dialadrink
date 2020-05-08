var keystone = require('keystone');
var Order = keystone.list("Order");

var pesapalHelper = require('../../helpers/PesaPal');
var router = keystone.express.Router();

router.get("/", function(req, res){
    var client = res.locals.appUser;
    var json = { 
        response: "error",
        data: []
    };

    if(!client){
        json.message = "Error getting user Orders! We could not resolve the logged in user..";
        return res.send(json);
    }

    var filter = {};

    if (res.locals.app == "com.dialadrinkkenya.rider"){
        filter['rider.phoneNumber'] = {
            $in: [
                client.phoneNumber.cleanPhoneNumber(),
                client.phoneNumber.cleanPhoneNumber().replace(/^\+?245/, "0")
            ].distinct()
        };
    } else if(res.locals.app == "com.dialadrinkkenya.office") {
        filter.$or = [
            {'rider': null},
            {'rider.confirmed': null},
            {'rider.confirmed': false}
        ];

        if (res.locals.lastCloseOfDay)
            filter.$and = [{
               orderDate: {
                   $gt: new Date(res.locals.lastCloseOfDay)
               }
            }];
    } else {     
        filter['delivery.phoneNumber'] =  {
            $in: [
                client.phoneNumber.cleanPhoneNumber(), 
                client.phoneNumber.cleanPhoneNumber().replace(/^\+?245/, "0")
            ].distinct()
        };
    }

    console.log("Looking up orders..")       

    Order.model.find(filter)
        .deepPopulate('cart.product.priceOptions.option')
        .populate('client')
        .exec((err, orders) => {
            if (err){
                json.message = "Error getting user Orders! " + err;
            } else {
                console.log("Found " + orders.length);

                json.response = "success";
                json.data = orders
                    .filter(o => o.cart.filter(c => c.product).length > 0)
                    .orderByDescending(o => o.orderDate)
                    .map(o => o.toAppObject());
            }
            
            return res.send(json);
        });
});

router.get("/:orderNo", function (req, res) {
    var json = {
        response: "error",
        message: "Error while getting order #" + req.params.orderNo,
        data: {}
    };
    var filter = {$or:[]};

    if (/^\d+$/.test(req.params.orderNo))
        filter.$or.push({ orderNumber: req.params.orderNo });
    else
        filter.$or.push({ _id: req.params.orderNo });

    Order.model.findOne(filter)
        .deepPopulate('cart.product.priceOptions.option')
        .populate('client')
        .exec((err, order) => {
            
            if (err){
                json.message += "! " + err;
            } else if(!order){
                json.message += "! No matching order Number";
            }else{
                delete json.message;
                json.response = "success";
                json.data = order.toAppObject();
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

        json.response = "success";
        var cartItems = getCartItems(req);
        var promo = req.session.promo || {};
        var deliveryDetails = Object.assign({}, client.toObject(), req.body, {
            platform: req.session.platform,
            clientIp: res.locals && res.locals.clientIp
        });

        Order.checkOutCartItems(cartItems, promo, deliveryDetails, function (err, order) {
            json.message = err ? (err.msg || err.message || err) : "Order placed successfully! We will contact you shortly with details of your dispatch.";
            
            if (err){
                json.response = "error";
                return res.send(json);
            }
            
            json.data = order.toAppObject();
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

            delete req.session.cart;
            req.session.save();
            
            return res.send(json);
        });
    }
});

router.post("/cancel/:orderNo", function(req, res){
    var orderNumber = req.params.orderNo || req.query.orderid;
    var json = {
        response: "error",
        message: "Error while getting order #" + orderNumber,
        data: {}
    };
    var filter = {
        $or: []
    };

    if (/^\d+$/.test(orderNumber))
        filter.$or.push({
            orderNumber: orderNumber
        });
    else
        filter.$or.push({
            _id: orderNumber
        });

    Order.model.findOne(filter)
        .deepPopulate('cart.product.priceOptions.option')
        .populate('client')
        .exec((err, order) => {

            if (err)
                json.message += "! " + err;            
            
            if (!order) {
                json.message += "! No matching order Number";
            } else {
                delete json.message;
                json.response = "success";
                order.state = 'cancelled';
                order.save();

                json.data = order.toAppObject();
            }

            return res.send(json);
        });
});


function getCartItems(req){
    var items = Object.values(req.session.cart || {});
    if(typeof req.body.item_id == "string")
    {
        items[0] = Object.assign({
            cartId: `${req.body.item_id}|${req.body.item_opt}`,
            product: req.body.item_id,
            price: parseFloat(req.body.item_price),
            quantity: req.body.item_opt,
            pieces: parseInt(req.body.item_pieces)
        }, items[0] || {});
    } else if (req.body.item_id) {
        for(var i = 0; i < req.body.item_id.length; i++){
            items[i] = Object.assign({
                cartId: `${req.body.item_id[i]}|${req.body.item_opt[i]}`,
                product: req.body.item_id[i],
                price: parseFloat(req.body.item_price[i]),
                quantity: req.body.item_opt[i],
                pieces: parseInt(req.body.item_pieces[i])
            }, items[i] || {});
        }
    }  

    return items;
}

module.exports = router;