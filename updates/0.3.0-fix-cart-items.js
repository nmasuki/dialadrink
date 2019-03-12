var keystone = require('keystone');
var CartItem = keystone.list('CartItem');

exports = module.exports = function (done) {
    CartItem.model.find({})
        .populate('product')
        .sort({date: -1})
        .exec(function (err, items) {
            items.forEach(item=>item.save());
            done();
        });
};