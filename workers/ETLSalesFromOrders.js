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
        orderDate: { $gt: new Date(self.worker.lastRun || '2021-01-01') }
    };

    Order.model.find(filter)
        .deepPopulate('client,cart.product.priceOptions.option')
        .sort({orderDate: -1})
        .exec(function (err, orders) {            
            if(err)
                return console.error("Error reading orders!", err || "Unknown");

            var sales = orders.map(o => {
                return {  
                    mode: "Online",
                    salePrice: o.total,
                    _id: "sale-" + o._id,
                    clientId: o.client.id,
                    dateOfSale: o.orderDate,
                    paymentMethod: getAppPaymentMethod(o.paymentMethod) ,              
                    location: [o.delivery.address, o.delivery.building, o.delivery.houseNumber].filter(x => !!x).join(", "),
                    productIds: o.cart.selectMany(c => new Array(c.pieces || 1).join(',').split(',')
                                      .map(x => c.product && c.product.id)).filter(x => !!x),
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
                    //TODO Send notification to office manager
                }
            })
            .then(next);
    }
    
    return Promise.resolve().then(next);
}