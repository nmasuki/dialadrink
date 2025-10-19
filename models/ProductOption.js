var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductOption Model
 * ==================
 */

var ProductOption = new keystone.List('ProductOption', {
	map: {name: 'quantity'},
	autokey: {from: 'quantity', path: 'key', unique: true},
});

ProductOption.add({
	quantity: {type: String, initial: true, required: true},
	description: {type: Types.Html, wysiwyg: true, height: 150}
});

ProductOption.relationship({ref: 'ProductPriceOption', path: 'priceOptions', refPath: 'option'});

ProductOption.defaultColumns = 'quantity, description';
ProductOption.register();
