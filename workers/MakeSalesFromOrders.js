var keystone = require('keystone');
var Order = keystone.list('Order');
var Sale = require('../helpers/LocalStorage').getInstance("sale");

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

function getWork(next, done) {
    var filter = {
        orderDate:{ 
            $gt: new Date(self.worker.lastRun || '2021-04-04')
        }
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
                    client: o.client,
                    products: o.cart.map(c => c.product),
                    salePrice: o.total,
                    description: "Online sale",
                    paymentMethod: o.paymentMethod
                };
            });

            if(sales.length)
                console.log("Generating " + sales.length + " new online sale records as from " + filter.orderDate.$gt.toISOString());
            else
                console.log("No sales online sale record to generate as from " + filter.orderDate.$gt.toISOString());

            next(null, sales, done);
        });
}

function doWork(err, sales, next) {
    if (err)
        return console.warn(err);

    if (sales && sales.length) {
        if(sales.length)
            console.log(sales.length + " new online sales..");        
        
        return Sale.save(sales).then(next);
    }
    
       return Promise.resolve().then(next);
}