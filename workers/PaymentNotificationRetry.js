var keystone = require('keystone');
var Order = keystone.list("Order");

function getWork(next) {
    Order.model.find({
            orderDate: {
                '$gt': new Date().addDays(-1),
                '$lt': new Date().addMinutes(-15)
            },
            state: 'Paid',
            payment: {
                notificationSent: false
            }
        })
        .exec(function (err, orders) {
            if (err)
                return next(err)

            if (orders && orders.length)
                orders.forEach(order => next(null, order));
            else
                console.log("No payment notifications to retry..");
        });
}

function doWork(err, order) {
    if (err)
        return console.error("Error while retrying Order notification!", err);

    order.sendOrderNotification((err, data) => {
        console.log("Updating order state='placed'!", data)

        //Update order state
        order.state = 'placed';
        order.notificationSent = !err;

        order.save((err) => {
            if (err)
                console.warn(err);
            else
                console.log("Order updated!");
        });
    });
}

module.exports = {
    run: () => getWork(doWork)
}