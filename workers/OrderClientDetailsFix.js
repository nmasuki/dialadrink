var keystone = require('keystone');
var Order = keystone.list('Order');

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

function getWork(next, done) {
    var filter = {
        orderDate:{ 
            $gt: new Date(self.worker.lastRun || '2017-01-01')
        },
        'delivery.firstName': { $gt: "" }
    };

    Order.model.find(filter)
        .deepPopulate('client,cart.product.priceOptions.option')
        .sort({orderDate: -1})
        .exec(function (err, orders) {            
            if(err)
                return console.error("Error reading orders!", err || "Unknown");

            orders = orders.filter(o => !o.client || (!o.client.firstName && !o.client.lastName));
            console.log(orders.length + " orders need fixing since " + filter.orderDate.$gt.toISOString());

            next(null, orders, done);
        });
}

function doWork(err, orders, next) {
    if (err)
        return console.warn(err);

    if (orders && orders.length) {
        if(orders.length)
            console.log(orders.length + " client orders to send..");        
        
        var index = -1;
        (function updateClient(){
            var order = orders[++index];
            console.log(`Extracting client from order ${index + 1}/${orders.length}.. order._id: ${order.id}, ${order.orderNumber}, Client: ${order.delivery.phoneNumber}`)
            
            if(order){
                order.updateClient(() => {
                    order.save();
                    order.client.update(updateClient);
                });                    
            } else {
                next();
            }         
        })();

    } else {
        if (typeof next == "function")
            next();

        return Promise.resolve();
    }
}