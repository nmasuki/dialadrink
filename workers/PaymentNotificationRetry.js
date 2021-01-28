var keystone = require('keystone');
var Order = keystone.list("Order");
var WorkProcessor = require('../helpers/WorkProcessor');

var self = module.exports = new WorkProcessor(getWork, doWork);

function getWork(next, done) {
    var filter = {
        orderDate: {
            '$gt': new Date().addDays(-1),
            '$lt': new Date().addMinutes(-15)
        },
        state: 'Paid',
        "payment.notificationSent": false
    };

    if (process.env.NODE_ENV == "development") {
        //delete filter.orderDate;
        filter["delivery.phoneNumber"] = "0720805835";
    }

    Order.model.find(filter)
        .deepPopulate('cart.product.priceOptions.option')
        .populate('client')
        .exec(function (err, orders) {
            if (err)
                return next(err)

            if (process.env.NODE_ENV == "development" && orders.length)
                next(null, [orders[0]], done);
            else
                next(null, orders, done);
        });
}

function doWork(err, orders, next) {
    if (err)
        return console.warn(err);

    if (orders && orders.length) {
        console.log(orders.length + " payment notifications to retry..");
        return Promise.all(orders.map(order => order.sendPaymentNotification()))
            .then(function () {
                if (typeof next == "function")
                    next();
            });

    } else {
        if (typeof next == "function")
            next();
    }
}