var keystone = require('keystone');
var lockFile = require('lockfile');
var Order = keystone.list("Order");

function getWork(next, done) {
    var filter = {
        state: 'placed',
        orderDate: {
            '$gt': new Date().addDays(-1),
            '$lt': new Date().addMinutes(-15)
        },
        notificationSent: false
    };

    if (keystone.get("env") == "development") {
        //delete filter.orderDate;
        filter["delivery.phoneNumber"] = "0720805835";
    }

    Order.model.find(filter)
        .exec(function (err, orders) {
            if (err)
                return next(err);

            if (keystone.get("env") == "development" && orders.length)
                next(null, [orders[0]], done);
            else
                next(null, orders, done);
        });
}

function doWork(err, orders, next) {
    if (err)
        return console.warn(err);

    if (orders && orders.length) {
        return Promise.all(orders.map(order => order.sendOrderNotification()))
            .then(function () {
                if (typeof next == "function")
                    next();
            });

    } else {
        console.log("No order notifications to retry..");
        if (typeof next == "function")
            next();
    }
}

var self = {
    run: function () {
        if (!self.lockFile)
            getWork(doWork);
        else
            lockFile.lock(self.lockFile, function (err) {
                if (err)
                    return console.warn("Could not aquire lock.", self.lockFile, err);

                getWork(function () {
                    var promise = doWork.apply(this, arguments);
                    if (!promise)
                        lockFile.unlock(self.lockFile);
                    else
                        promise.finally(() => lockFile.unlock(self.lockFile));
                });
            });
    }
};

module.exports = self;