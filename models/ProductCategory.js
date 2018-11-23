var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductCategory Model
 * ==================
 */

var ProductCategory = new keystone.List('ProductCategory', {
    autokey: {from: 'name', path: 'key', unique: true},
});

ProductCategory.add({
    name: {type: String, required: true, initial: true},
    pageTitle: {type: String},
    description: {type: Types.Html, wysiwyg: true, height: 150},
});

ProductCategory.relationship({ref: 'Product', path: 'category'});
ProductCategory.relationship({ref: 'ProductSubCategory', path: 'category'});

ProductCategory.register();