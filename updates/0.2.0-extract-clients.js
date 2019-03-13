var keystone = require('keystone');
var Order = keystone.list('Order');

exports = module.exports = function (done) {
    Order.model.find({})
        .sort({orderDate: -1})
        .exec(function (err, orders) {
            var index = -1;
            (function updateClient(){
                if(orders[index]) orders[index].save();
                var order = orders[++index];
                if(order)
                    order.updateClient(updateClient);                
            })();
            done();
        });
};