var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Location Model
 * ==========
 */
var Location = new keystone.List('Location', {
	map: { name: 'location' },
	//autokey: { path: 'key', unique: true },
	defaultSort: 'name',
});

Location.add({
	name: { type: String, initial: true, required: true },
	city: { type: String },
	show: { type: Boolean },
	page: { type: Types.Relationship, ref: 'Page' },
	description: { type: Types.Html, wysiwyg: true, height: 250 },
	location: {
		lat: {type: Types.Number },
		lon: {type: Types.Number },
	}
});

Location.schema.pre('save', function (next) {
	
});

Location.defaultColumns = 'name, city, page, show|10%';
Location.register();
