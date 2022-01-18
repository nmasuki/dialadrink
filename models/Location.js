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

	description: { type: Types.Html, wysiwyg: true, height: 250 },
	deliveryCharges: {type: Types.Number, default:300 },
	modifiedDate: { type: Date, default: Date.now, noedit: true },
	
	location: {
		lat: { type: Types.Number, noedit: true},
		lng: { type: Types.Number, noedit: true },
	},

	location_type: { type: String, noedit: true },
	viewport: {
		northeast:{
			lat: {type: Types.Number, noedit: true },
			lng: {type: Types.Number, noedit: true },
		},		
		southwest: {
			lat: {type: Types.Number, noedit: true },
			lng: {type: Types.Number, noedit: true },
		}
	}
});

Location.schema.pre('save', function (next) {
	var $this = this;
	this.href = this.href || this.name.cleanId().trim();
	this.city = this.city || 'Nairobi, Kenya';

	/**/
	if (!this.modifiedDate || this.modifiedDate < new Date().addDays(-10)) {
		var url = `https://maps.googleapis.com/maps/api/geocode/json` +
			`?address=${this.name} ${this.city}` +
			`&key=${process.env.GOOGLE_API_KEY1}`;

		najax.get({
			url: url,
			success: function (json) {
				if(json){
					location = JSON.parse(json);
					if (location.results && location.results[0] && location.results[0].geometry){
						var geometry = location.results[0].geometry;
						for(var i in geometry)
							if(geometry.hasOwnProperty(i))
								$this[i] = geometry[i];
					}
				}

				this.modifiedDate = new Date();
    			next();
			},
			error: function () {
				next();
			}
		});
	} else /**/
		next();
});

Location.defaultColumns = 'name, city, deliveryCharges, description.lat, description.lng, show|10%';
Location.register();