var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductBrand Model
 * ==================
 */
var ProductBrand = new keystone.List('ProductBrand', {
    autokey: {from: '_id', path: 'key', unique: true},
});

ProductBrand.add({
    name: {type: String, required: true, initial: true},
    logo: {type: Types.CloudinaryImage, folder: "brands"},
    pageTitle: {type: String},
    country: {type: String},
    metaDescription: {type: String},
    tags: {type: Types.TextArray},
    category: {type: Types.Relationship, ref: 'ProductCategory', many: false},
    description: {type: Types.Html, wysiwyg: true, height: 150},
    modifiedDate: {type: Date, default: Date.now},
    company: {
        name: {type: String},
        description: {type: Types.Html, wysiwyg: true, height: 150},
    }
});

ProductBrand.relationship({ref: 'Product', path: 'product', refPath: 'brand'});
ProductBrand.defaultColumns = 'name, logo, pageTitle, category, country';

ProductBrand.schema.pre('save', function (next) {
    this.modifiedDate = new Date();
    next();
});

ProductBrand.register();

ProductBrand.findPopularBrands = function (callback) {
    return keystone.list('Product')
        .findPublished({})
        .sort('-popularity')
        .exec((err, _products) => {
            var brands = (_products ||[]).map(p => {
                if(p.brand && p.category && p.brand.category != p.category._id){
                    p.brand.category = p.category;
                    p.brand.save();
                }
                return p.brand;
            }).filter(b => b).distinctBy(b => b._id);

            callback(err, brands, _products);
        });
};