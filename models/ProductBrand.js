var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductBrand Model
 * ==================
 */
var products = [];
var ProductBrand = new keystone.List('ProductBrand', {
    autokey: {from: 'name', path: 'key', unique: true},
});

ProductBrand.add({
    name: {type: String, required: true, initial: true},
    logo: {type: Types.CloudinaryImage},
    pageTitle: {type: String},
    category: {type: Types.Relationship, ref: 'ProductCategory', many: false},
    description: {type: Types.Html, wysiwyg: true, height: 150},
    company: {
        name: {type: String},
        description: {type: Types.Html, wysiwyg: true, height: 150},
    }
});

ProductBrand.relationship({ref: 'Product', path: 'product', refPath: 'brand'});

ProductBrand.schema.virtual('popularity').get(function () {
    return products.filter(p => p.brand && p.brand._id == this._id).sum(p => p.popularity);
});

ProductBrand.register();

keystone.list('Product').findPublished({})
    .exec((err, _products) => {
        if (!err)
            products = _products
    });

ProductBrand.findPopularBrands = function (callback) {
    keystone.list('Product').findPublished({})
        .exec((err, _products) => {
            if (!err)
                products = _products
            var brands = _products.map(p => {
                if(p.brand && p.category && p.brand.category != p.category._id){
                    p.brand.category = p.category;
                    //p.brand.save();
                }
                return p.brand;
            }).filter(b => b).distinctBy(b => b._id);
            callback(err, brands);
        });
};