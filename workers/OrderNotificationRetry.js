var keystone = require('keystone');
var lockFile = require('lockfile');
var Order = keystone.list("Order");

function getWork(next) {
    var filter = {
        state: 'placed',
        orderDate: {
            '$gt': new Date().addDays(-1),
            '$lt': new Date().addMinutes(-15)
        },
        notificationSent: false
    };

    if(keystone.get("env") == "development"){
        delete filter.orderDate;
        filter["delivery.phoneNumber"] = "0720805835";
    }

    Order.model.find()
        .exec(function (err, orders) {
            if (err)
                return next(err)

            if (orders && orders.length) {
                orders.forEach(order => next(null, order));
            } else
                console.log("No order notifications to retry..");
        });
}

function doWork(err, order) {
    if (err)
        return console.error("Error while retrying Order notification!", err);

    return order.sendOrderNotification();
}

var self = module.exports = {
    run: function () {
        if (!self.lockFile)
            getWork(doWork);
        else
            lockFile.lock(self.lockFile, function (err) {
                if (err)
                    return console.error("Could not aquire lock.", self.lockFile, err);
                    
                getWork(function () {
                    doWork.apply(this, arguments).always(function () {
                        //Unlock file
                        lockFile.unlock(self.lockFile);
                    });
                });
            })
    }
}