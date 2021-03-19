var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    console.log("Extracting clients from products...");
    Product.model.find({})
        .exec(function (err, products) {
            products = products.filter(p => !!p);

            products.forEach(product => {
                if(product){
                    var options = product.options.filter(p => p.offerPrice == 0);
                    if (options && options.length){
                        options.forEach(p => { p.offerPrice = null; });
                        product.save();
                    }
                }
            });

            done();
        });
};
