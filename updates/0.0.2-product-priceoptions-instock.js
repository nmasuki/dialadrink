// Import
var keystone = require('keystone');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    Product.model.find()
        .sort({ popularity: -1 })
        .populate('brand')
        .populate('category')
        .populate('ratings')
        .deepPopulate("subCategory.category,priceOptions.option")
        .exec((err, products) => {
            products.forEach(product => {
                if(product.priceOptions.every(p => p.inStock != product.inStock)){
                    product.priceOptions.forEach(p => {
                        p.inStock = product.inStock;
                        p.save();
                    });
                }
            });

            done();
        });
};