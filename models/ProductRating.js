var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * PostCategory Model
 * ==================
 */

var ProductRating = new keystone.List('ProductRating', {
	hidden: true,
	autokey: {from: 'userId', path: 'key'},
});

ProductRating.add({
	userId: {type: String},
	product: {type: Types.Relationship, ref: 'Product', many: false},
	rating: {type: Number}
});

ProductRating.relationship({ref: 'Product', path: 'product', refPath: 'ratings'});
ProductRating.register();
