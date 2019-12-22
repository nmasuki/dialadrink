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
    var next = function(){
        console.log("Update done!", __filename);
        setTimeout(function () {
            ProductCategory.model.findOne({ name: 'Cognac' })
                .exec((err, cat) => {
                    Product.model.find({})
                        .exec((err, products) => {
                            if (err)
                                return console.log(err);

                            products.forEach(p => {
                                if (cat && p.tags.contains(cat.name))
                                    p.category = cat;
                                p.save();
                            });
                        });

                    if (cat)
                        cat.save();
                });
        }, 5000);
            
        done();
    };



    Product.model.find({})
        .exec((err, products) => {
            if (err)
                return console.log(err);

            var tags = [];//products.selectMany(p => p.tags).filter(t => t);
            tags = tags
                .filter(t => t.length <= 20)            
                .map(t => t.replace("  ", " ").replace('`', "'"))
                .map(t => t.replace(/(\d+(.\d+)?)\s+(m?l)/i, "$1$3").replace("Litre", "litre"))
                .map(t => t.trim().toProperCase())
                .concat(definedTags)
                .distinctBy(t => t.toLowerCase());
            
            tags.forEach((t, i) => {
                Product.search(t, (err, products)=>{
                    if(err)
                        return console.log(err);

                    products.forEach(p => {
                        var added = false;
                        if (!p.tags.filter(t => t.length <= 20).contains(pt => pt && pt.trim().toLowerCase().contains(t.toLowerCase()))) {
                            p.tags = p.tags.filter(pt => {
                                if (!pt) return false;
                                if (pt.length > 20) return true;
                                pt = pt.trim().toLowerCase();
                                return pt == t.toLowerCase() || !t.toLowerCase().contains(pt);
                            }) ;
                            p.tags.push(t);
                            added =true;
                        }

                        p.save(function (err) {
                            if (err) return;
                            if (added)
                                console.log(`Added tag:'${t}' to '${p.name}'`, p.tags.join(', '));
                            
                            if (i >= tags.length - 1)
                                next();
                        });

                        
                    });

                    if (products.length == 0 && i >= tags.length - 1)
                        next();
                }, true);
            }); 

            if(tags.length == 0)
                next();
        });
};
