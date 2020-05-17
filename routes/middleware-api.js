var keystone = require("keystone");

function getDeliveryCount(){

}

function getProductCount() {
    var filter = {state: 'published'};
    return new Promise((resolve, reject) => {
        keystone.list('Product').model.count({filter}).exec((err, count) => resolve(count));
    });
}

function getOrderCount() {
    var filter = {};

    if (res.locals.app == "com.dialadrinkkenya.rider") {
        filter['rider.phoneNumber'] = {
            $in: [
                client.phoneNumber.cleanPhoneNumber(),
                client.phoneNumber.cleanPhoneNumber().replace(/^\+?245/, "0")
            ].distinct()
        };

        if (res.locals.lastCloseOfDay)
            filter.$and = [{
                orderDate: {
                    $gt: new Date(res.locals.lastCloseOfDay)
                }
            }];
    } else if (res.locals.app == "com.dialadrinkkenya.office") {
        filter.$or = [{
                'rider': null
            },
            {
                'rider.confirmed': null
            },
            {
                'rider.confirmed': false
            }
        ];

        if (res.locals.lastCloseOfDay)
            filter.$and = [{
                orderDate: {
                    $gt: new Date(res.locals.lastCloseOfDay)
                }
            }];
    } else {
        filter['delivery.phoneNumber'] = {
            $in: [
                client.phoneNumber.cleanPhoneNumber(),
                client.phoneNumber.cleanPhoneNumber().replace(/^\+?245/, "0")
            ].distinct()
        };
    }

    return new Promise((resolve, reject) => {
        keystone.list('Order').model.count(filter).exec((err, count) => resolve(count));
    });
}

function getInventoryCount(){

}

function getSalesValue(){}

function getPurchasesValue(){}

function getExpensesValue(){}

function getRiderCount() {}

function getCloseOfDayCount() {}

function getClientCount() {}

function getDashboardItemCount() {}

function getAppUserCount() {}

function getNotificationCount(){}

exports.globalCache = (req, res, next) => {
    if (req.params.entity != "dashboarditem") return next();

    var menuCounts = (res.locals.menuCounts = {});
    
    return Promise.all([
            getDeliveryCount(), getProductCount(),
            getOrderCount(), getInventoryCount(),
            getSalesValue(), getPurchasesValue(),
            getExpensesValue(), getRiderCount(),
            getCloseOfDayCount(), getClientCount(),
            getDashboardItemCount(), getAppUserCount(),
            getNotificationCount()
        ]).then(values => {
        var keys = [
            "delivery", "product",
            "orders", "inventory",
            "sales", "purchases",
            "expenses", "riders",
            "closeofday", "client",
            "dashboarditem", "user",
            "notifications"
        ];

        keys.forEach((k, i) => menuCounts[k] = values[i]);
    });
};