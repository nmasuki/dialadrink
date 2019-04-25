var MoveSms = require("../helpers/movesms");
var keystone = require('keystone');

var Types = keystone.Field.Types;
var sms = require('../helpers/AfricasTalking').Instance; //new MoveSms();

/**
 * Order Model
 * ==========
 */

var Order = new keystone.List('Order', {
    defaultSort: '-orderDate',
    autokey: { path: 'key', from: 'orderNumber' },
});

Order.add({
    state: {
        type: Types.Select,
        options: 'created, placed, dispatched, delivered, pending, cancelled, paid',
        default: 'created',
        index: true
    },

    orderNumber: {type: Number, noedit: true},
    orderDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    modifiedDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    
    smsNotificationSent: {type: Boolean, noedit: true},
    notificationSent: {type: Boolean, noedit: true},    

    cart: {type: Types.Relationship, ref: 'CartItem', many: true, noedit: true},
    client: {type: Types.Relationship, ref: 'Client', noedit: true},
    orderAmount: {type: Number, noedit: true},
    
    //Payment Details
    paymentMethod: {type: String, noedit: true},
    payment:  {
        method: {type: String, noedit: true},
        amount: {type: Number, noedit: true},
        smsNotificationSent: {type: Boolean, noedit: true},
        notificationSent: {type: Boolean, noedit: true},
        notificationType: {type: String, noedit: true},
        
        url: {type: String, noedit: true},
        shortUrl: {type: String, noedit: true},
        referenceId: {type: String, noedit: true},
        transactionId: {type: String, noedit: true},
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
        code: {type: String, noedit: true},
        name: {type: String, noedit: true},
        discount: {type: Number, noedit: true},
        discountType: {type: String, noedit: true},
    },

    //Delivery Details
    delivery: {
        firstName: {type: String, noedit: true},
        lastName: {type: String, noedit: true},
        phoneNumber: {type: String, noedit: true},
        email: {type: String, noedit: true},
        address: {type: String, noedit: true},
        building: {type: String, noedit: true},
        houseNumber: {type: String, noedit: true},
        clientIp: {type: String, noedit: true}
    },

});

Order.schema.pre('save', function (next) {
    this.modifiedDate = Date.now();
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();

    this.updateClient(next);
});

Order.schema.virtual("discount").get(function () {
    if (this.cart)
        return Math.round(this.promo.discountType == "percent" ?
            this.cart.sum(c => c.pieces * c.price) * this.promo.discount / 100 :
            this.promo.discount || 0
        );
    return 0;
});

Order.schema.virtual("currency").get(function () {
    if (this.cart)
        return this.cart
            .filter(c=>c.currency)
            .map(c => c.currency.replace("Ksh", "KES")).distinct().join(',');
    return "KES";
})

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
    return this.subtotal - this.discount;
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
Order.schema.methods.updateClient = function(next){
    var order = this;
    if(order.delivery){
        var findOption = {"$or":[]};
        var phoneNumber = (this.delivery.phoneNumber || "").trim();
        if(phoneNumber) {
            if(phoneNumber)
                phoneNumber = phoneNumber.cleanPhoneNumber();
            findOption["$or"].push({"phoneNumber": new RegExp(phoneNumber)});
        }else{
            var email = this.delivery.email || null;
            if(email){
                var username = email.split('@')[0];
                if(username)                    
                    findOption["$or"].push({"email": new RegExp("^" + username)});
            }
        }

        if(findOption["$or"].length)
            keystone.list("Client").model.findOne(findOption)
                .exec((err, client)=>{
                    if(err)
                        return console.warn(err);
                    
                    var delivery = order.delivery.toObject();
                    client = client || clients.find(c=>c.phoneNumber == phoneNumber || c.email == email);
                    if(client){
                        client.clientIps.push(order.clientIp);
                        if(client.createdDate < order.orderDate)
                            for(var i in delivery){
                                if(delivery[i] && typeof delivery[i] != "function")
                                    client[i] = delivery[i];                                
                            }
                    }else{
                        client = keystone.list("Client").model(delivery);
                        client.createdDate = order.orderDate;
                        client.clientIps.push(order.clientIp);
                        clients.push(client);
                    }

                    client.save(function(){
                        order.client = client;
                        if(typeof next == "function")
                            next();
                    });                    
                });   
        else if(typeof next == "function")
            next();
    }else{
        if(typeof next == "function")
            next();
    }
};

Order.schema.methods.placeOrder = function (next) {
    console.log("Placing order!");
    var order = this;
    if(!order.notificationSent){
        order.notificationSent = true;
        var pIds = order.cart.map(c=>c.product._id || c.product);
        keystone.list("Product").model.find({_id: {"$in": pIds }})
            .exec((err, products)=>{
                var items = order.cart.map(function(c){ return {pieces: c.pieces, pid: c.product._id || c.product}});
                if(products)
                    products.forEach(p => {
                        var item = items.find(c => p._id.toString() == c.pid.toString());
                        item.product = p;
                    });

                var itemsMsg = `Drinks:${items.map(c=>c.pieces + '*' + c.product.name).join(', ')}`; 

                var msg = `${order.payment.method} Order recieved from: ${order.delivery.firstName}(${order.delivery.phoneNumber}). Amount: ${order.payment.amount}, ${itemsMsg}.`;
                sms.send((process.env.CONTACT_PHONE_NUMBER || "254723688108"), msg);                
            });
    }

    this.sendOrderNotification((err, data) => {
        console.log("Updating order state='placed'!", data)

        //Update order state
        this.state = 'placed';
        this.save((err) => {
            if (err)
                console.warn(err);
            else
                console.log("Order updated!");
        });

        if (typeof next == "function")
            next(err);

        //popularity goes up 100x
        this.cart.forEach(c => {
            keystone.list("Product").findOnePublished({
                _id: c.product._id
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

    return new Promise((resolve, reject)=>{

        if (order.payment.notificationSent) {
            console.log("Payment notification already sent.");
            if (typeof next == "function")
                next("Payment notification already sent.");

            return reject("Payment notification already sent.");
        }
    
        //Send SMS notification
        if (order.delivery.phoneNumber) {
            message = `Dial a Drink: Your payment of ${order.currency||''}${order.payment.amount} ` + 
                `for order #${order.orderNumber} has been received. Your order will be dispatched shortly. `+
                `Thank You for using http://dialadrinkkenya.com`;
            
            if(!order.payment.smsNotificationSent)
                order.sendSMSNotification(message);                
        }
    
        var email = new keystone.Email('templates/email/receipt');
    
        //Hack to make use of nodemailer..
        email.transport = require("../helpers/mailer");
    
        var subject = "Payment received #" + order.orderNumber + " - " + keystone.get("name");
        if (keystone.get("env") == "development")
            subject = "(Testing) " + subject;
    
        var locals = {
            layout: 'email',
            page: {
                title: keystone.get("name") + " Order"
            },
            order: order
        };
    
        var emailOptions = {
            subject: subject,
            to: {
                name: order.delivery.firstName,
                email: order.delivery.email || "simonkimari@gmail.com"
            },
            cc: [],
            from: {
                name: keystone.get("name"),
                email: process.env.EMAIL_FROM
            }
        };
    
        keystone.list("User").model.find({
                receivesOrders: true
            })
            .exec((err, users) => {
                if (err)
                    return reject(console.log(err));
    
                if (users && users.length)
                    users.forEach(u => {
                        if (!emailOptions.to.email)
                            emailOptions.to.email = u.email;
                        if (emailOptions.to.email != u.email)
                            emailOptions.cc.push(u.toObject());
                    });            
                else {
                    console.warn("No users have the receivesOrders right!");
                    if (keystone.get("env") == "production")
                        emailOptions.cc.push("simonkimari@gmail.com");
                    else
                        emailOptions.cc.push("nmasuki@gmail.com");
                }
    
                console.log(
                    "Sending Payment notification!",
                    "User", order.delivery.email,
                    "Admins", emailOptions.cc.map(u => u.email || u).join()
                );
    
                email.send(locals, emailOptions, (err, a) => {
                    console.log("Payment notification Sent!", err, a)
                    if (err)
                        return reject(console.warn(err));
    
                    order.payment.notificationSent = true;
                    order.save(resolve);
                });            
    
                if (typeof next == "function")
                    next(err);
            });
    
        this.cart.forEach(c => {
                keystone.list("Product").findOnePublished({
                    _id: c.product._id
                }, (err, product) => {
                    if (product)
                        product.addPopularity(100);
                });
            });
    });

};

Order.schema.methods.sendSMSNotification = function (next, message) {
    var order = this;
    
    message = message || `Dial a Drink: Your order #${this.orderNumber} has been received.`;
    if(this.payment.method == "PesaPal")
        message += ` Please proceed to pay ${this.currency||''} ${this.total} online ${this.payment.shortUrl?' via ' + this.payment.shortUrl:''}`;
    else
        message += ` You will be required to pay ${this.currency||''} ${this.total} on delivery`;
                  
    return sms.send([order.delivery.phoneNumber], message.trim(), function(err, res){
        if(err)
            console.warn.apply(this, arguments);
        else{
            order.payment.smsNotificationSent = true;
            order.save();


        }
        if(typeof next == "function")
            next(err, res);
    });
};

Order.schema.methods.sendOrderNotification = function (next) {
    var order = this;
    if (!order.orderNumber)
        order.orderNumber = Order.getNextOrderId();

    var email = new keystone.Email('templates/email/order');
    //Hack to make use of nodemailer..
    email.transport = require("../helpers/mailer");

    var subject = "Your order #" + order.orderNumber + " - " + keystone.get("name");
    if (keystone.get("env") == "development")
        subject = "(Testing)" + subject;

    return new Promise((resolve, reject)=>{
        Order.model.findOne({ _id: order._id })
            .deepPopulate('cart.product.priceOptions.option')
            .exec((err, order) => {
                if (err)
                    return reject(next(err));

                if (!order)
                    return reject(next(`Order [${order._id}}] not found!`));

                if (!order.cart.length) {
                    if (that.cart.length)
                        order.cart = that.cart;
                    else
                        return reject(next("Error while getting cart Items"));
                }

                var locals = {
                    layout: 'email',
                    page: {
                        title: keystone.get("name") + " Order"
                    },
                    order: order
                };

                var emailOptions = {
                    subject: subject,
                    to: {
                        name: order.delivery.firstName,
                        email: order.delivery.email
                    },
                    cc: [],
                    from: {
                        name: keystone.get("name"),
                        email: process.env.EMAIL_FROM
                    }
                };

                keystone.list("User").model.find({ receivesOrders: true })
                    .exec((err, users) => {
                        if (err)
                            return console.log(err);

                        if (users && users.length) {
                            users.forEach(u => {
                                if (!emailOptions.to.email)
                                    emailOptions.to.email = u.email;
                                if (emailOptions.to.email != u.email)
                                    emailOptions.cc.push(u.toObject());
                            });
                        } else {
                            console.warn("No users have the receivesOrders rights!");
                            if (keystone.get("env") == "production")
                                emailOptions.cc.push("simonkimari@gmail.com");
                            else
                                emailOptions.cc.push("nmasuki@gmail.com");                    
                        }

                        console.log(
                            "Sending order notification!",
                            "User", emailOptions.to.email,
                            "Admins", "\"" + emailOptions.cc.map(u => u.email || u).join() + "\""
                        );

                        email.send(locals, emailOptions, (err, a) => {
                            if(err)
                                return reject(console.warn("Error while sending email.", err.info));

                            console.log("Order notification Sent!", a);
                            order.notificationSent = true;
                            order.save();
                               
                            resolve();                   
                        });

                        if (typeof next == "function")
                            next(err);

                        if (order.delivery.phoneNumber) {
                            message = `Dial a Drink: Your order #${order.orderNumber} has been received. ` +
                                `Please pay ${order.currency||''} ${order.total} ${order.payment.method? 'in ' + order.paymentMethod: ''}` +
                                `${order.payment.shortUrl?' via ' + order.payment.shortUrl:''}`;
                            
                            order.sendSMSNotification(message);                
                        }
                    });
            });
    })
};

keystone.deepPopulate(Order.schema);

Order.defaultColumns = 'orderNumber, orderDate|15%, client|15%, delivery.phoneNumber, payment.amount, state';

Order.register();

//Some random number from which to start order order Ids
var autoId = 7000000 + (10000000 * Math.random());

Order.getNextOrderId = () => (autoId = (autoId + 100));

Order.model.find().sort({'orderNumber': -1 })
    .limit(1)
    .exec(function (err, data) {
        if (data[0] && data[0].orderNumber)
            autoId = data[0].orderNumber;
    });