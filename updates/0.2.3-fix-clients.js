var keystone = require('keystone');
var Order = keystone.list('Order');
var Order = keystone.list('Order');

exports = module.exports = function (done) {
    console.log("Extracting clients from orders");
    Order.model.find({orderDate:{ $gt: new Date('2019-01-01') }})
        .deepPopulate('client,cart.product.priceOptions.option')
        .sort({orderDate: -1})
        .exec(function (err, orders) {
            var index = -1;
            orders = orders.filter(o => !o.client || !o.client.firstName);
            
            (function updateClient(){
                console.log(`Extracting client from order ${index + 1}/${orders.length}`)
                if(orders[index]) orders[index].save();
                var order = orders[++index];
                if(order){
                    order.updateClient(() => {
                        order.save().then(updateClient);
                    });                    
                }          
            })();

            done();
        });
};