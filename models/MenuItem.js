var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * MenuItem Model
 * ==========
 */

var MenuItem = new keystone.List('MenuItem', {
	drilldown: 'parent',
	defaultSort: 'level',
	map: { name: 'href' },
	autokey: { path: 'key', unique: true, from: '_id'},
});

MenuItem.add({
	href: { type: String, initial: true },
	label: { type: String },
	index: { type: Number, default: 0 },
	level: { type: Number, default: 0 },
	show: { type: Boolean },
	type: {
		type: Types.Select,
		options: 'top, bottom, bottom col1, bottom col2, bottom col3, bottom col4',
		default: 'top',
		index: true,
	},
	page: { type: Types.Relationship, ref: 'Page' },
	parent: { type: Types.Relationship, ref: 'MenuItem' },
	submenus: { type: Types.Relationship, ref: 'MenuItem', many: true },
});

MenuItem.relationship({ ref: 'MenuItem', refPath: 'submenus' });
MenuItem.relationship({ ref: 'MenuItem', refPath: 'parent' });

MenuItem.defaultColumns = 'label, level, href, parent, show';
// Add deepPopulate plugin only for MenuItem since it has simple relationships
keystone.deepPopulate(MenuItem.schema);
MenuItem.register();
