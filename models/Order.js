var MoveSms = require("../helpers/movesms");
var pesapalHelper = require('../helpers/pesapal');
var keystone = require('keystone');
var CartItem = keystone.list("CartItem");

var Types = keystone.Field.Types;
var sms = new MoveSms();

/**
 * Order Model
 * ==========
 */

var Order = new keystone.List('Order', {
    defaultSort: '-orderDate',
    autokey: {
        path: 'key',
        from: 'orderNumber'
    },
});

Order.add({
    state: {
        type: Types.Select,
        options: 'created, placed, dispatched, delivered, pending, cancelled, paid',
        default: 'created',
        index: true
    },

    orderNumber: {
        type: Number,
        noedit: true
    },
    orderDate: {
        type: Types.Datetime,
        index: true,
        default: Date.now,
        noedit: true
    },
    modifiedDate: {
        type: Types.Datetime,
        index: true,
        default: Date.now,
        noedit: true
    },

    smsNotificationSent: {
        type: Boolean,
        noedit: true
    },
    notificationSent: {
        type: Boolean,
        noedit: true
    },

    cart: {
        type: Types.Relationship,
        ref: 'CartItem',
        many: true,
        noedit: true
    },
    client: {
        type: Types.Relationship,
        ref: 'Client',
        noedit: true
    },
    orderAmount: {
        type: Number,
        noedit: true
    },

    //Payment Details
    paymentMethod: {
        type: String,
        noedit: true
    },
    payment: {
        method: {
            type: String,
            noedit: true
        },

        subtotal: {
            type: Number,
            noedit: true
        },
        amount: {
            type: Number,
            noedit: true
        },

        smsNotificationSent: {
            type: Boolean,
            noedit: true
        },
        notificationSent: {
            type: Boolean,
            noedit: true
        },
        notificationType: {
            type: String,
            noedit: true
        },

        url: {
            type: String,
            noedit: true
        },
        shortUrl: {
            type: String,
            noedit: true
        },
        referenceId: {
            type: String,
            noedit: true
        },
        transactionId: {
            type: String,
            noedit: true
        },
        state: {
            type: String,
            //options: 'Pending, Submited, Cancelled, Paid',
            default: 'Pending',
            noedit: true,
            index: true
        },
    },

    //Promo details
    promo: {
        code: {
            type: String,
            noedit: true
        },
        name: {
            type: String,
            noedit: true
        },
        discount: {
            type: Number,
            noedit: true
        },
        discountType: {
            type: String,
            noedit: true
        },
    },

    charges: {
        chargesName: {
            type: Types.TextArray
        },
        chargesAmount: {
            type: Types.TextArray
        }
    },

    //Delivery Details
    delivery: {
        platform: {
            type: String,
            noedit: true,
            default: "WEB"
        },
        firstName: {
            type: String,
            noedit: true
        },
        lastName: {
            type: String,
            noedit: true
        },
        phoneNumber: {
            type: String,
            noedit: true
        },
        email: {
            type: String,
            noedit: true
        },
        address: {
            type: String,
            noedit: true
        },
        building: {
            type: String,
            noedit: true
        },
        houseNumber: {
            type: String,
            noedit: true
        },
        clientIp: {
            type: String,
            noedit: true
        }
    },

});

Order.schema.pre('save', function (next) {
    this.modifiedDate = Date.now();
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();

    this.updateClient(next);
});


Order.schema.virtual("currency").get(function () {
    if (this.cart)
        return this.cart
            .filter(c => c.currency)
            .map(c => c.currency.replace("Ksh", "KES")).distinct().join(',');
    return "KES";
});

Order.schema.virtual("discount").get(function () {
    if (this.cart)
        return Math.round(this.promo.discountType == "percent" ?
            this.cart.sum(c => c.pieces * c.price) * this.promo.discount / 100 :
            this.promo.discount || 0
        );
    return 0;
});

Order.schema.virtual("chargesAmt").get(function () {
    var charges = 0;

    if (this.charges)
        charges = this.charges.chargesAmount.sum(c => parseFloat("" + c));

    return charges;
});

Order.schema.virtual("subtotal").get(function () {
    if (this.cart)
        return this.cart.sum(function (c) {
            var price = c.pieces * c.price;
            if (c.offerPrice && c.price > c.offerPrice)
                price = c.pieces * c.offerPrice
            return price;
        });
    return 0;
});

Order.schema.virtual("total").get(function () {
    return this.subtotal + this.chargesAmt - this.discount;
});

Order.schema.virtual("deliveryAddress").get(function () {
    var delivery = this.delivery;
    var address = "";

    for (var i in delivery) {
        if (i != 'userId' && delivery[i] && typeof delivery[i] != "function")
            address += "{0}:{1}<br>\r\n".format(i.toProperCase(), delivery[i].toString().toProperCase())
    }

    return address;
});

var clients = [];
Order.schema.methods.updateClient = function (next) {
    var order = this;
    if (order.delivery) {
        var findOption = {
            "$or": []
        };
        var phoneNumber = (this.delivery.phoneNumber || "").trim();

        if (phoneNumber) {
            if (phoneNumber)
                phoneNumber = phoneNumber.cleanPhoneNumber();
            findOption.$or.push({
                "phoneNumber": new RegExp(phoneNumber)
            });
        } else {
            var email = (this.delivery.email || "").trim();
            if (email) {
                findOption.$or.push({
                    "email": new RegExp(email.escapeRegExp(), "i")
                });
            }
        }

        if (findOption.$or.length)
            keystone.list("Client").model.findOne(findOption)
            .exec((err, client) => {
                if (err)
                    return console.warn(err);

                var delivery = order.delivery.toObject();
                client = client || clients.find(c => c.phoneNumber == phoneNumber || c.email == email);
                if (client) {
                    client.clientIps.push(order.clientIp);
                    if (client.createdDate < order.orderDate)
                        for (var i in delivery) {
                            if (delivery[i] && typeof delivery[i] != "function")
                                client[i] = delivery[i];
                        }
                } else {
                    client = keystone.list("Client").model(delivery);
                    client.createdDate = order.orderDate;
                    client.clientIps.push(order.clientIp);
                }

                client.save(function () {
                    order.client = client;
                    if (typeof next == "function")
                        next();
                });
            });
        else if (typeof next == "function")
            next();
    } else {
        if (typeof next == "function")
            next();
    }
};

Order.schema.methods.placeOrder = function (next) {
    console.log("Placing order!");
    var order = this;
    order.sendOrderNotification().then((data) => {
        console.log("Updating order state='placed'!", data);

        //Update order state
        order.state = 'placed';
        order.save((err) => {
            if (err)
                console.warn(err);
            else
                console.log("Order updated!");
        });

        if (typeof next == "function")
            next(err, data);

        //popularity goes up +100
        order.cart.forEach(c => {
            keystone.list("Product").findOnePublished({
                _id: c.product._id || c.product
            }, (err, product) => {
                if (product)
                    product.addPopularity(100);
            });
        });
    });
};

Order.schema.methods.sendPaymentNotification = function (next) {
    var order = this;
    if (!order.orderNumber)
        order.orderNumber = Order.getNextOrderId();

    if (order.payment.notificationSent) {
        var msg = "Payment notification already sent.";

        console.log(msg);
        if (typeof next == "function")
            next(msg);

        return Promise.reject(msg);
    }

    var subject = `Payment received #${order.delivery.platform[0]}${order.orderNumber} - ${keystone.get("name")}`;
    if (order.client && order.client._id) {
        //Send SMS notification
        if (order.delivery.phoneNumber) {
            message = `Dial a Drink: Your payment of ${order.currency||''}${order.payment.amount} ` +
                `for order #${order.orderNumber} has been received. Your order will be dispatched shortly. ` +
                `Thank You for using http://dialadrinkkenya.com`;

            if (!order.payment.smsNotificationSent)
                order.client.sendSMSNotification(message).then(() => {
                    order.payment.smsNotificationSent = true;
                    order.save();
                });
        }

        //Sent Emmail Notification
        order.client.sendEmailNotification(subject, 'receipt', {
            order: order
        }).then(() => {
            order.payment.notificationSent = true;
            order.save(resolve);
        });

    } else {
        //TODO: Read client by client._id/phoneNumber/email/create then send as above
        console.error("Block not implemented yet!");
    }

};

Order.schema.methods.sendOrderNotification = function (next) {
    var that = this;
    if (!that.orderNumber)
        that.orderNumber = Order.getNextOrderId();

    return Order.model.findOne({ _id: that._id })
        .deepPopulate('cart.product.priceOptions.option')
        .populate('client')
        .exec((err, order) => {
            if (err)
                return Promise.reject(err);

            if (!order)
                return Promise.reject(`Order [${order._id}}] not found!`);

            if (!order.cart.length) {
                if (that.cart.length)
                    order.cart = that.cart;
                else
                    return Promise.reject("Error while getting cart Items!!");
            }

            var promise = Promise.resolve();

            //Send SMS Notification to vender
            if(!order.notificationSent){
                order.notificationSent = true;
                var items = order.cart;
                var itemsMsg = `Drinks:${items.map(c => c.pieces + '*' + c.product.name).join(', ')}`;
                var msg = `${order.payment.method} Order recieved from: ${order.delivery.firstName}(${order.delivery.phoneNumber}). Amount: ${order.payment.amount}, ${itemsMsg}.`;

                promise.then(() => sms.sendSMS((process.env.CONTACT_PHONE_NUMBER || "254723688108"), msg));
            }

            //Send SMS 
            if (order.delivery.phoneNumber && !order.smsNotificationSent) {
                message = `Dial a Drink: Your order #${order.delivery.platform[0]}${order.orderNumber} has been received. ` +
                    `Please pay ${order.currency||''} ${order.total} ${order.payment.method? 'in ' + order.paymentMethod: ''}` +
                    `${order.payment.shortUrl?' via ' + order.payment.shortUrl:''}`;

                if (order.payment.method == "PesaPal")
                    message += ` Please proceed to pay ${order.currency||''} ${order.total} online ${order.payment.shortUrl?' via ' + order.payment.shortUrl:''}`;
                else
                    message += ` You will be required to pay ${order.currency||''} ${order.total} on delivery`;

                if (order.client && order.client._id) {
                    promise.then(() => order.client.sendSMSNotification(message).then(() => order.smsNotificationSent = true));
                }
            }

            //Send Email
            var subject = `Your order #${that.delivery.platform[0]}${that.orderNumber} - ${keystone.get("name")}`;
            return promise.then(() => order.save()).then(() => {
                return order.client.sendEmailNotification(subject, 'order', {
                    appUrl: keystone.get("url"),
                    order: order.toObject()
                });
            });
        });
};

Order.schema.set('toObject', {
    transform: function (order, ret, options) {
        var charges = [];
        ret = ret || {};

        for (var i = 0; i < order.charges.chargesName.length; i++) {
            charges[i] = {
                name: order.charges.chargesName[i].camelCaseToSentence(),
                amount: parseFloat("" + order.charges.chargesAmount[i])
            };
        }

        var virtuals = [
            "id", "status", "orderNumber",
            "currency", "discount",
            "chargesAmt", "subtotal", "total",
            "state", "orderDate", "modifiedDate",
            "client", "orderAmount",
            "paymentMethod", "payment",
            //"promo","delivery"
        ];

        virtuals.forEach(v => ret[v] = order[v]);

        if (order.promo)
            ret.promo = order.promo.toObject();
        if (order.delivery)
            ret.delivery = order.delivery.toObject();

        //created, placed, dispatched, delivered, pending, cancelled, paid
        var time = (new Date().getTime() - order.orderDate.getTime()) / (1000 * 60);
        if (['created', 'placed'].indexOf(ret.state) >= 0) {
            if (time > 3 * 60)
                ret.status = "4";
            else if (time > 45) 
                ret.status = "3";
            else if (time > 5) 
                ret.status = "1";
            else 
                ret.status = "0";            
        }else{
            var map = {
                pending: "0", 
                dispatched: "1",
                cancelled: "2",  
                delivered: "3", 
                paid: "4"
            };
            ret.status = map[order.state] || map.cancelled;
        }

        ret.chargesArr = charges;
        if (order.cart.length && order.cart[0].constructor.name == "ObjectID")
            ret.cart = order.cart.map(c => c.toObject());

        return ret;
    }
});

keystone.deepPopulate(Order.schema);

Order.defaultColumns = 'orderNumber, orderDate|15%, client|15%, delivery.platform, delivery.phoneNumber, payment.amount, state';

Order.register();

Order.checkOutCartItems = function (cart, promo, deliveryDetails, callback) {
    deliveryDetails = deliveryDetails || {};
    promo = promo || {};

    var chargesKeys = Object.keys(deliveryDetails).filter(k => k.toLowerCase().indexOf("charge") >= 0);
    var charges = chargesKeys.sum(k => deliveryDetails[k]);

    var subtotal = cart.sum(function (c) {
        var price = c.pieces * c.price;
        if (c.offerPrice && c.price > c.offerPrice)
            price = c.pieces * c.offerPrice;
        return price;
    });

    var discount = Math.round(promo.discountType == "percent" ?
        cart.sum(c => c.pieces * c.price) * promo.discount / 100 :
        promo.discount || 0
    );

    var order = new Order.model({
        cart: cart.map(item => {
            //console.log(item)
            var cartItem = new CartItem.model({});

            cartItem.date = item.date;
            cartItem.state = item.state;
            cartItem.pieces = item.pieces;
            cartItem.quantity = item.quantity;
            cartItem.product = item.product;

            cartItem.save();
            return cartItem;
        }),
        paymentMethod: deliveryDetails.paymentMethod == "Cash" ? "Cash on Delivery" : deliveryDetails.paymentMethod,
        payment: {
            method: deliveryDetails.paymentMethod,
            subtotal: subtotal,
            amount: subtotal + charges - discount
        },
        promo: promo,
        clientIp: deliveryDetails.clientIp,
        delivery: deliveryDetails
    });

    chargesKeys.forEach(k => {
        order.charges.chargesName.push(k);
        order.charges.chargesAmount.push(deliveryDetails[k]);
    });

    return order.save((err) => {
        if (err)
            return console.warn("Error while saving Order! " + err);

        if (order.payment.method == "PesaPal") {
            var paymentUrl = `https://www.dialadrinkkenya.com/payment/${order.orderNumber}`;
            pesapalHelper.shoternUrl(paymentUrl, function (err, shortUrl) {
                order.payment.url = paymentUrl;
                if (!err)
                    order.payment.shortUrl = shortUrl;

                order.save(() => {
                    order.placeOrder();
                    if (typeof callback == "function")
                        callback(err, order);
                });
            });
        } else {
            order.placeOrder();
            if (typeof callback == "function")
                callback(null, order);
        }

        return order;
    });
};

//Some random number from which to start order order Ids
var autoId = 7000000 + (10000000 * Math.random());

Order.getNextOrderId = () => (autoId = (autoId + 100));

Order.model.find().sort({
        'orderNumber': -1
    })
    .limit(1)
    .exec(function (err, data) {
        if (data[0] && data[0].orderNumber)
            autoId = data[0].orderNumber;

        if (keystone.get("env") != "production")
            autoId -= 52;

    });