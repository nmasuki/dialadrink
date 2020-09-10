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

function getProductCount(res) {
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
    } else if(client) {
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
    return new Promise((resolve, reject) => {
        var items = LocalStorage.getInstance("sale").getAll();
        if (res.locals.lastCloseOfDay)
            items = items.filter(d => d.createdDate > res.locals.lastCloseOfDay);

        if (res.locals.app == "com.dialadrinkkenya.rider") {
            items = items.filter(d => d.riderId == res.locals.appUser.id);
        } else if (res.locals.app == "com.dialadrinkkenya.office") {
            //items = items.filter(d => d.createdDate > res.locals.lastCloseOfDay);
        } else if (res.locals.appUser){
            items = items.filter(d => d.clientId == res.locals.appUser.id);
        }

        resolve(items.sum(s => s.salePrice));
    });
}

function getPurchasesValue(res){ 
    return new Promise((resolve, reject) => {
        var items = LocalStorage.getInstance("purchase").getAll();
        if (res.locals.lastCloseOfDay)
            items = items.filter(d => d.createdDate > res.locals.lastCloseOfDay);

        if (res.locals.app == "com.dialadrinkkenya.rider") {
            items = items.filter(d => d.riderId == res.locals.appUser.id);
        } else if (res.locals.app == "com.dialadrinkkenya.office") {
            //items = items.filter(d => d.createdDate > res.locals.lastCloseOfDay);
        } else {
            items = items.filter(d => d.clientId == res.locals.appUser.id);
        }

        resolve(items.sum(s => s.cost || s.amount));
    });
}

function getExpensesValue(res){ 
    return new Promise((resolve, reject) => {
        var items = LocalStorage.getInstance("expense").getAll();
        if (res.locals.lastCloseOfDay)
            items = items.filter(d => d.createdDate > res.locals.lastCloseOfDay);

        if (res.locals.app == "com.dialadrinkkenya.rider") {
            items = items.filter(d => d.riderId == res.locals.appUser.id);
        } else if (res.locals.app == "com.dialadrinkkenya.office") {
            //items = items.filter(d => d.createdDate > res.locals.lastCloseOfDay);
        } else if(res.locals.appUser){
            items = items.filter(d => d.clientId == res.locals.appUser.id);
        }

        resolve(items.sum(s => s.amount));
    });
}

function getRiderCount(res) { 
    return new Promise((resolve, reject) => {
        var items = LocalStorage.getInstance("rider").getAll();
        resolve(items.length);
    });  
 }

function getCloseOfDayCount() { return Promise.resolve(0); }

function getClientCount(res) {
    return new Promise((resolve, reject) => {
        keystone.list('Client').model.count({}).exec((err, count) => resolve(count));
    });
}

function getDashboardItemCount(res) {
    return new Promise((resolve, reject) => {
        var items = LocalStorage.getInstance("dashmenuitem").getAll();
        resolve(items.length);
    });    
}

function getAppUserCount(res) {
    return new Promise((resolve, reject) => {
        keystone.list('AppUser').find({accountType: { $ne: null }}).then(users => {
            if(users && users.length)
                return resolve(users.length);
            resolve(0);
        });
    }); 
}

function getNotificationCount(res){ 
    return new Promise((resolve, reject) => {
        var items = LocalStorage.getInstance("notification").getAll();
        items = items.filter(d => d.toId == res.locals.appUser.id || d.fromId == res.locals.appUser.id);
        return resolve(items.length);
    }); 
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

        keys.forEach((k, i) => menuCounts[k] = parseInt(values[i]));
        
        next();
    });
};