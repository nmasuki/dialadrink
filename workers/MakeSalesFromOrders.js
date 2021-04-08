var keystone = require('keystone');
var Order = keystone.list('Order');
var Sale = require('../helpers/LocalStorage').getInstance("sale");

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

function getAppPaymentMethod(method){
    method = method || "";
    //Cash,MPESA,PesaPal,COOP,Swipe On Delivery,Credit
    var mapping = {
        "Cash": ["Cash", "Cash on Delivery"],
        "MPESA": ["MPESA", "MPESA on Delivery"],
        "PesaPal": ["PesaPal"],
        "COOP":["CyberSource"],
    };

    for(var i in mapping){
        var match = mapping[i].find(x => x.toLowerCase() == method.toLowerCase());
        if(match)
            return i;
    }

    return method.split(' ')[0];
}

function getWork(next, done) {
    var filter = {
        orderDate: { $gt: new Date(self.worker.lastRun || '2021-04-04') }
    };

    Order.model.find(filter)
        .deepPopulate('client,cart.product.priceOptions.option')
        .sort({orderDate: -1})
        .exec(function (err, orders) {            
            if(err)
                return console.error("Error reading orders!", err || "Unknown");

            var sales = orders.map(o => {
                return {
                    _id: "online-" + o._id,
                    dateOfSale: o.orderDate,
                    clientId: o.client.id,
                    productIds: o.cart.selectMany(c => new Array(c.pieces || 1).join(',').split(',').map(x=> c.product.id)),
                    salePrice: o.total,
                    mode: "Online",
                    paymentMethod: getAppPaymentMethod(o.paymentMethod)
                };
            });

            if(sales.length)
                console.log("Generating " + sales.length + " new online sale records as from " + filter.orderDate.$gt.toISOString());

            next(null, sales, done);
        });
}

function doWork(err, sales, next) {
    if (err)
        return console.warn(err);

    if (sales && sales.length) {
        console.log(sales.length + " new online sales..");
        return Sale.save(sales)
            .then(res => {
                if(res.updates && res.updates.length){
                    //Send
                }
            })
            .then(next);
    }
    
    return Promise.resolve().then(next);
}