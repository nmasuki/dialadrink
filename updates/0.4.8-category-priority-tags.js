var keystone = require('keystone');
var Product = keystone.list('Product');
var ProductCategory = keystone.list('ProductCategory');

var definedTags = [
    "Cognac", "VSOP", "VS", "XO","Chocolate", "Cream",
    "Scotch", "Bourbon", "Single Malt", "Irish", "Blended", "Japanese", "Rye", "Malt", "Tennessee", "Grain", 
    "Single Pot Still", "Corn", "White", "Red", "Dry", "Rose", "Sparkling", "Riesling", 
    "Pinot Gris", "Sauvignon Blanc", "Cabernet Sauvignon", "Chardonnay", "Pinot Noir", "Zinfandel", "Syrah", 
    "Sauvignon", "Blanc", "Cabernet", 
    "Malbec", "Petite Sirah", "Monastrell", "Pinotage", "Grenache", "Tempranillo", "GSM", "Rhône Blend", 
    "Carignan", "Gamay", "Schiava", "Sémillon", "Viognier"
];

exports = module.exports = function (done) {
    keystone.list("ProductCategory").model.find().exec((err, categories) => {
        categories.forEach(that => {
            if (!that.priorityTags || that.priorityTags.length <= 0) {
                Product.findByCategory({
                    _id: that._id
                }, (err, products) => {
                    if (err) return;
                    var tags = Product.getUIFilters(products, 100);
                    that.priorityTags = tags.map(t => t.filter);
                    that.save();
                });
            }
        });

        done();
    });
};
