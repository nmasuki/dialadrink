var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Order Model
 * ==========
 */

var Order = new keystone.List('Order', {
    map: {name: 'orderNumber'},
    autokey: {path: 'key', from: 'orderNumber', unique: true},
});

Order.add({
    orderNumber: {type: Number, noedit: true},
    orderDate: {type: Types.Date, index: true, default: Date.now, noedit: true},
    modifiedDate: {type: Types.Date, index: true, default: Date.now, noedit: true},
    notificationSent: {type: Boolean, noedit: true},
    paymentMethod: {type: String, noedit: true},

    state: {
        type: Types.Select,
        options: 'created, placed, dispatched, delivered, pending, cancelled, paid',
        default: 'created',
        index: true
    },

    promo: {
        code: {type: String, noedit: true},
        name: {type: String, noedit: true},
        discount: {type: Number, noedit: true},
        discountType: {type: String, noedit: true},
    },

    cart: {type: Types.Relationship, ref: 'CartItem', many: true, noedit: true},

    //Delivery Details
    delivery: {
        userId: {type: String, noedit: true, visible: false},
        firstName: {type: String, noedit: true},
        lastName: {type: String, noedit: true},
        phoneNumber: {type: String, noedit: true},
        email: {type: String, noedit: true},
        address: {type: String, noedit: true},
        building: {type: String, noedit: true},
        houseNumber: {type: String, noedit: true}
    },

    payment:  {
        referenceId: {type: String, noedit: true},
        transactionId: {type: String, noedit: true},
        method: {type: String, noedit: true},
        amount: {type: Number, noedit: true},
        notificationSent: {type: Boolean, noedit: true},
        notificationType: {type: String, noedit: true},
        state: {
            type: Types.Select,
            options: 'Pending, Submited, Cancelled, Paid',
            default: 'Pending',
            noedit: true,
            index: true
        },
    },
});

Order.schema.pre('save', function (next) {
    this.modifiedDate = Date.now();
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();
    next();
});

Order.schema.virtual("discount").get(function () {
    if(this.cart)
        return Math.round(this.promo.discountType == "percent"
            ? this.cart.sum(c => c.pieces * c.price) * this.promo.discount / 100
            : this.promo.discount || 0
        );
    return 0;
});

Order.schema.virtual("subtotal").get(function () {
    if(this.cart)
        return this.cart.sum(function(c){
			var price = c.pieces * c.price;
			if(c.offerPrice && c.price > c.offerPrice)
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

Order.schema.methods.placeOrder = function (next) {
    console.log("Placing order!")
    this.sendUserNotification((err, data) => {
        console.log("Updating order state='placed'!", data)

        //Update order state
        this.state = 'placed';
        this.notificationSent = !err;
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
            keystone.list("Product").findOnePublished({_id: c.product._id}, (err, product) => {
                if (product)
                    product.addPopularity(100);
            });
        });
    });
};

Order.schema.methods.sendPaymentNotification = function(next){
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();

    var order = this;
    if(order.payment.notificationSent)
    {
        console.log("Payment notification already sent.");
        if (typeof next == "function")
            next("Payment notification already sent.");

        return;  
    }

    var email = new keystone.Email('templates/views/receipt');
    
    //Hack to make use of nodemailer..
    email.transport = require("../helpers/mailer");

    var subject = "Paymeny received #" + order.orderNumber + " - " + keystone.get("name");
    if (keystone.get("env") == "development")
        subject = "(Testing) " + subject;

    var locals = {
        layout: 'email',
        page: {title: keystone.get("name") + " Order"},
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

    keystone.list("User").model.find({receivesOrders: true})
        .exec((err, users) => {
            if (err)
                return console.log(err)

            if (users && users.length)
                users.forEach(u => emailOptions.cc.push(u.toObject()));
            else {
                console.warn("No users have the receivesOrders right!");
                if (keystone.get("env") == "development")
                    emailOptions.cc.push("nmasuki@gmail.com");
                else
                    emailOptions.cc.push("simonkimari@gmail.com");
            }

            console.log(
                "Sending Payment notification!",
                "User", order.delivery.email,
                "Admins", emailOptions.cc.map(u => u.email || u).join()
            );

            email.send(locals, emailOptions, (err, a) => {
                console.log("Payment notification Sent!", err, a)
                if (err)
                    console.warn(err);
            });

            if (typeof next == "function")
                next(err);        
        });
};

Order.schema.methods.sendUserNotification = function (next) {
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();

    var email = new keystone.Email('templates/views/order');

    //Hack to make use of nodemailer..
    email.transport = require("../helpers/mailer");

    var subject = "Your order #" + this.orderNumber + " - " + keystone.get("name");
    if (keystone.get("env") == "development")
        subject = "(Testing)" + subject;

    Order.model.findOne({_id: this._id})
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
            if (err)
                return next(err);

            if (!order)
                return next(`Order [${order._id}}] not found!`);

            if (!order.cart.length) {
                if (that.cart.length)
                    order.cart = that.cart;
                else
                    return next("Error while getting cart Items");
            }

            if(!order.delivery.email){
                if(order.delivery.phoneNumber){
                    var number = order.delivery.phoneNumber;
                    if(number.startsWith('0'))
                        number = "254" + number.trimLeft('0');
                    
                    order.delivery.email = number + "@safaricomsms.com";
                }
            }
            
            var locals = {
                layout: 'email',
                page: {title: keystone.get("name") + " Order"},
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

            keystone.list("User").model.find({receivesOrders: true})
                .exec((err, users) => {
                    if (err)
                        return console.log(err)

                    if (users && users.length)
                        users.forEach(u => emailOptions.cc.push(u.toObject()));
                    else {
                        console.warn("No users have the receivesOrders rights!");
                        emailOptions.cc.push("simonkimari@gmail.com");
                    }


                    console.log(
                        "Sending order notification!",
                        "User", order.delivery.email,
                        "Admins", "\"" + emailOptions.cc.map(u => u.email || u).join() + "\""
                    );

                    email.send(locals, emailOptions, (err, a) => {
                        console.log("Order notification Sent!", err, a)

                        if (err)
                            console.warn(err);
                    });

                    if (typeof next == "function")
                        next(err);
                });
        });
};

keystone.deepPopulate(Order.schema);

Order.defaultColumns = 'orderDate|20%, orderNumber, delivery.firstName|20%, delivery.phoneNumber';
Order.register();

//Some random number from which to start counting
var autoId = 72490002;

Order.getNextOrderId = () => (autoId = (autoId + 100));

Order.model.find().sort({'orderNumber': -1})
    //.limit(1)
    .exec(function (err, data) {
        if (data[0] && data[0].orderNumber)
            autoId = data[0].orderNumber;
    });

