var keystone = require('keystone');
var najax = require('najax');
var Types = keystone.Field.Types;

/**
 * Location Model
 * ==========
 */
var Location = new keystone.List('Location', {
	//autokey: {path: 'href', from: 'name', unique: true},
	map: {
		name: 'name'
	},
	defaultSort: 'name',
});

Location.add({
	name: { type: String, initial: true, required: true },
	href: { type: String, initial: true },
	city: { type: String },
	show: { type: Boolean },
	//page: { type: Types.Relationship, ref: 'Page' },
	description: { type: Types.Html, wysiwyg: true, height: 250 },
	location: {
		lat: {type: Types.Number },
		lng: {type: Types.Number },
	}
});

Location.schema.pre('save', function (next) {
	var $this = this;
	this.href = this.href || this.name.cleanId().trim();
	/**/
	if (!this.location || !this.location.lat || !this.location.lng) {
		var url = `https://maps.googleapis.com/maps/api/geocode/json` +
			`?address=${this.name} ${this.city}` +
			`&key=${process.env.GOOGLE_API_KEY1}`;
		najax.get({
			url: url,
			success: function (json) {
				if(json){
					location = JSON.parse(json);
					if (location.results && location.results[0] && location.results[0].geometry){
						$this.location = location.results[0].geometry.location;
					}
				}
				next();
			},
			error: function () {
				next();
			}
		});
	} else /**/
		next();
});

Location.defaultColumns = 'name, city, show|10%';
Location.register();