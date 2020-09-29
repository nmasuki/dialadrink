var keystone = require('keystone');
var Order = keystone.list('Order');

exports = module.exports = function (done) {
    console.log("Extracting clients from orders...");
    Order.model.find({})
        .sort({orderDate: -1})
        .exec(function (err, orders) {
            var index = -1;
            orders = orders.filter(o => !o.client || !o.client.firstName);

            (function updateClient(){
                console.log(`Extracting client from order ${index + 1}/${orders.length}...`);
                var order = orders[++index];
                if(order)
                    order.updateClient(updateClient);                
            })();

            done();
        });
};