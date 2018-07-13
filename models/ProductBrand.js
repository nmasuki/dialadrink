var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductBrand Model
 * ==================
 */

var ProductBrand = new keystone.List('ProductBrand', {
    autokey: {from: 'name', path: 'key', unique: true},
});

ProductBrand.add({
    name: {type: String, required: true, initial: true},
    pageTitle: {type: String},
    category: {type: Types.Relationship, ref: 'ProductCategory', many: false},
    description: {type: Types.Html, wysiwyg: true, height: 150},
    company: {
        name: {type: String},
        description: {type: Types.Html, wysiwyg: true, height: 150},
    }
});

ProductBrand.relationship({ref: 'Product', path: 'product', refPath: 'brand'});

ProductBrand.register();
