var keystone = require('keystone');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    Product.model.find({}).exec(function (err, products) {
        products.forEach(product =>{
            if((product.name && product.name.toLowerCase().indexOf("gift") >= 0) || 
                (product.description && product.description.toLowerCase().indexOf("gift") >= 0)){
                    product.isGiftPack = true;
                    product.save(err => {
                        if (err)
                            return console.log(err, product);
                        console.log("Updated product " + product.name);
                    });
                }
        });
        done();  
    });
};