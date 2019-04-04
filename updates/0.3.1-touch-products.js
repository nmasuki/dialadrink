var keystone = require('keystone');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    Product.model.find({})
        .populate('brand')
        .populate('category')
        .populate('subCategory')
        .populate('ratings')
        .populate('category')
        .deepPopulate("priceOptions.option")
        .exec((err, products) => {
            return products.map(p => p.save())
        }).then(() => {
            done()
        });
}