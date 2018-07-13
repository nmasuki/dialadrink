var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * BlogCategory Model
 * ==================
 */

var BlogCategory = new keystone.List('BlogCategory', {
	autokey: { from: 'name', path: 'key', unique: true },
});

BlogCategory.add({
	name: { type: String, required: true },
});

BlogCategory.relationship({ ref: 'Post', path: 'post', refPath: 'categories' });

BlogCategory.register();
