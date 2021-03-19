// Import
var keystone = require('keystone');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    var tags = ["cigars-and-ciggarrettes", "soft-drinks"];
    
    tags.forEach(tag => {
        Product.search(tag, (err, products) => {
            if(err) return console.warn("Error!!", err);
            console.log(`Found ${products.length} products with tag '${tag}'`);
            products.forEach(p => {
                p.tags.push("extras"); 
                p.save(err => {
                    if(err) return console.warn("Error!!", err);
                    console.log("Saved " + p.name);
                });
            });
        });
    });

    done();
};