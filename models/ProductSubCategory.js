var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductSubCategory Model
 * ==================
 */

var ProductSubCategory = new keystone.List('ProductSubCategory', {
    autokey: {from: 'name', path: 'key', unique: true},
});

ProductSubCategory.add({
    name: {type: String, required: true, initial: true},
    category: {type: Types.Relationship, ref: 'ProductCategory'},
});

ProductSubCategory.relationship({ref: 'Product', path: 'product', refPath: 'subCategory'});
ProductSubCategory.register();
