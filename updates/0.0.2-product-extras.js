// Import
var keystone = require('keystone');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    Product.search("cigars-and-ciggarrettes", (err, products) => {
        products.forEach(p => {
            p.tags.push("extras"); 
            p.save();
        });
    });

    Product.search("soft-drinks", (err, products) => {
        products.forEach(p => {
            p.tags.push("extras");
            p.save();
        });
    }); 

    done();
};