var keystone = require("keystone");
var LocalStorage = require('../helpers/LocalStorage');

function getDeliveryCount(res){
    var deliveries = LocalStorage.getInstance("delivery").getAll();
    if (res.locals.lastCloseOfDay)
        deliveries = deliveries.filter(d => d.createdDate > res.locals.lastCloseOfDay);

    if (res.locals.app == "com.dialadrinkkenya.rider"){
        deliveries = deliveries.filter(d => d.riderId == res.locals.appUser.id);
    } else if (res.locals.app == "com.dialadrinkkenya.office") {
        //deliveries = deliveries.filter(d => d.createdDate > res.locals.lastCloseOfDay);
    } else {
        deliveries = deliveries.filter(d => d.clientId == res.locals.appUser.id);
    }
    
    return Promise.resolve(deliveries.length);
}

function getProductCount() {
    var filter = {state: 'published'};
    return new Promise((resolve, reject) => {
        keystone.list('Product').model.count(filter).exec((err, count) =>{ 
            resolve(count);
        });
    });
}

function getOrderCount(res) {
    var filter = {},
        client = res.locals.appUser;

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

function getInventoryCount(){ return Promise.resolve(0); }

function getSalesValue(res){ 
    var sales = LocalStorage.getInstance("sale").getAll();
    if (res.locals.lastCloseOfDay)
        sales = sales.filter(d => d.createdDate > res.locals.lastCloseOfDay);

    if (res.locals.app == "com.dialadrinkkenya.rider") {
        sales = sales.filter(d => d.riderId == res.locals.appUser.id);
    } else if (res.locals.app == "com.dialadrinkkenya.office") {
        //deliveries = deliveries.filter(d => d.createdDate > res.locals.lastCloseOfDay);
    } else {
        sales = sales.filter(d => d.clientId == res.locals.appUser.id);
    }

    return Promise.resolve(sales.sum(s => s.salePrice));
}

function getPurchasesValue(){ return Promise.resolve(5000); }

function getExpensesValue(){ return Promise.resolve(4000); }

function getRiderCount() { 
    var riders = LocalStorage.getInstance("rider").getAll();
    return Promise.resolve(riders.length);
 }

function getCloseOfDayCount() { return Promise.resolve(0); }

function getClientCount() {
    return new Promise((resolve, reject) => {
        keystone.list('Client').model.count({}).exec((err, count) => resolve(count));
    });
}

function getDashboardItemCount() {
    var items = LocalStorage.getInstance("dashmenuitem").getAll();
    return Promise.resolve(items.length);
}

function getAppUserCount() {
    var items = LocalStorage.getInstance("appuser").getAll();
    return Promise.resolve(items.length);
}

function getNotificationCount(){ 
    var items = LocalStorage.getInstance("notification").getAll();
    items = items.filter(d => d.toId == res.locals.appUser.id || d.fromId == res.locals.appUser.id);
    return Promise.resolve(items.length);
 }

exports.initLocals = (req, res, next) => {
    if (req.path != "/dashmenuitem") return next();

    var menuCounts = (res.locals.menuCounts = {});
    
    return Promise.all([
            getDeliveryCount(res), getProductCount(res),
            getOrderCount(res), getInventoryCount(res),
            getSalesValue(res), getPurchasesValue(res),
            getExpensesValue(res), getRiderCount(res),
            getCloseOfDayCount(res), getClientCount(res),
            getDashboardItemCount(res), getAppUserCount(res),
            getNotificationCount(res)
        ]).then(values => {
        var keys = [
            "delivery", "product",
            "orders", "inventory",
            "sales", "purchases",
            "expenses", "riders",
            "closeofday", "client",
            "dashmenuitem", "appuser",
            "notification"
        ];

        keys.forEach((k, i) => menuCounts[k] = values[i]);
        next();
    });
};