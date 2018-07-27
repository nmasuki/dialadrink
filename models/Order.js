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

    state: {
        type: Types.Select,
        options: 'created, placed, dispatched, delivered, paid',
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
    }
});

Order.schema.pre('save', function (next) {
    this.modifiedDate = Date.now();
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();
    next();
});

Order.schema.virtual("discount").get(function () {
    return Math.round(this.promo.discountType == "percent"
        ? this.cart.sum(c => c.pieces * c.price) * this.promo.discount / 100
        : this.promo.discount || 0
    );
});

Order.schema.virtual("subtotal").get(function () {
    return this.cart.sum(c => c.pieces * (c.offerPrice && c.price > c.offerPrice ? c.offerPrice : c.price));
});

Order.schema.virtual("total").get(function () {
    return this.subtotal - this.discount;
});

Order.schema.virtual("deliveryAddress").get(function () {
    var delivery = this.delivery;
    var address = "";

    for (var i in delivery) {
        if (i != 'userId' && delivery[i])
            address += "{0}:{1}<br>\r\n".format(i.toProperCase(), delivery[i].toProperCase())
    }

    return address;
});

Order.schema.methods.placeOrder = function (next) {
    console.log("Placing order!")
    this.sendUserNotification((err, data) => {
        console.log("Updating order state='placed'!")

        //Update order state
        this.state = 'placed';
        this.notificationSent = !err;
        this.save((err) => {
            if (err)
                console.warn(err);
            else
                console.log("Order updated!")
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

Order.schema.methods.sendUserNotification = function (next) {
    if (!this.orderNumber)
        this.orderNumber = Order.getNextOrderId();

    var that = this;
    var email = new keystone.Email('templates/email/order');

    //Hack to make use of nodemailer..
    email.transport = require("../helpers/mailer");

    var subject = "Your order at " + keystone.get("name");
    if (keystone.get("env") == "development")
        subject = "(Testing)" + subject;

    var orderId = this._id;
    Order.model.findOne({_id: orderId})
        .deepPopulate('cart.product.priceOptions.option')
        .exec((err, order) => {
                if (err)
                    return next(err);

                if (!order)
                    return next(`Order [${orderId}}] not found!`);

                if (!order.cart.length) {
                    if (that.cart.length)
                        order.cart = that.cart;
                    else
                        return next("Error while getting cart Items");
                }

                var locals = {
                    layout: 'email',
                    page: {title: keystone.get("name") + " Order"},
                    order: order
                };

                var emailOptions = {
                    subject: subject,
                    to: {name: order.delivery.firstName, email: order.delivery.email || "simonkimari@gmail.com"},
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
                            emailOptions.cc.push("simonkimari@gmail.com");
                        }

                        console.log("Sending Order notification!",
                            "User", order.delivery.email,
                            "Admins", emailOptions.cc.map(u => u.email || u).join()
                        );
                        email.send(locals, emailOptions, (err, a) => {
                            console.log("Order notification Sent!", err, a)

                            if (err)
                                console.warn(err);

                            if (typeof next == "function")
                                next(err)
                        });

                    });
            }
        )
    ;

}
;

keystone.deepPopulate(Order.schema);

Order.defaultColumns = 'orderDate|20%, orderNumber, delivery.firstName|20%, delivery.phoneNumber';
Order.register();

//Some random number from which to start counting
var autoId = 72490002;

Order.getNextOrderId = () => (autoId = (autoId + 100));

Order.model.find().sort({'orderNumber': -1})//.limit(1)
    .exec(function (err, data) {
        if (data[0] && data[0].orderNumber)
            autoId = data[0].orderNumber;
    });

