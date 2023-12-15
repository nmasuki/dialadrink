var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Page Model
 * ==========
 */

var Page = new keystone.List('Page', {
	map: {name: 'name'},
	autokey: {path: 'key', from: 'href', unique: true}
});

Page.add({
	name: {type: String },
	href: {type: String },
	state: { type: Types.Select, options: 'draft, published', default: 'draft', index: true },
	title: {type: String},
	meta: {type: String },
	h1: {type: String},
	h1s: {type: Types.TextArray},
    bannerImages: {type: Types.CloudinaryImages, folder: "images" },
    mobileBannerImages: {type: Types.CloudinaryImages, folder: "images" },
	breafContent: { type: Types.Html, wysiwyg: true, height: 250, width: 500 },
	content: { type: Types.Html, wysiwyg: true, height: 500, width: 500 },
});

Page.defaultColumns = 'name, title, h1, state';
Page.register();
