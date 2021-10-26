var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * BlogCategory Model
 * ==================
 */

var BlogCategory = new keystone.List('BlogCategory', {
    autokey: {from: 'name', path: 'key', unique: true},
});

BlogCategory.add({
    name: {type: String, required: true, initial: true},
    regexMatch: {type: String},
});

BlogCategory.relationship({ref: 'Blog', path: 'blog', refPath: 'categories'});

BlogCategory.register();
