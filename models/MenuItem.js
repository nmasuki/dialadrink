var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * MenuItem Model
 * ==========
 */

var MenuItem = new keystone.List('MenuItem', {
	map: { name: 'label' },
	autokey: { path: 'key', from: 'href', unique: true },
	defaultSort: 'level',
	drilldown: 'parent',
});

MenuItem.add({
	href: { type: String, initial: true, required: true },
	label: { type: String },
	index: { type: Number },
	level: { type: Number },
	show: { type: Boolean },
	type: {
		type: Types.Select,
		options: 'top, bottom, bottom col1, bottom col2, bottom col3, bottom col4',
		default: 'draft',
		index: true,
	},
	page: { type: Types.Relationship, ref: 'Page' },
	parent: { type: Types.Relationship, ref: 'MenuItem' },
	submenus: { type: Types.Relationship, ref: 'MenuItem', many: true },
});

MenuItem.relationship({ ref: 'MenuItem', path: 'submenus' });
MenuItem.relationship({ ref: 'MenuItem', path: 'parent' });

MenuItem.defaultColumns = 'label, level, parent, href|20%, show|20%';


keystone.deepPopulate(MenuItem.schema);

MenuItem.register();
