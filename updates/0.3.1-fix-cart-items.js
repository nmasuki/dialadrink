var keystone = require('keystone');
var CartItem = keystone.list('CartItem');

exports = module.exports = function (done) {
    CartItem.model.find({name: null})
        .populate('product')
        .sort({date: -1})
        .exec(function (err, items) {
            console.log(`Fixing ${items.length} cart items..`);
            items.forEach(item => item.save());
            done();
        });
};