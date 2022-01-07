var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Promo Model
 * ==========
 */

var Promo = new keystone.List('Promo', {
	map: {name: 'code'},
	autokey: {path: 'key', from: 'code', unique: true},
});

Promo.add({
	code: {type: String, unique: true},
	name: {type: String },
	discount: {type: Number },//Percentage 
	discountType: { type: Types.Select, options: 'percent, KES', default: 'percent', index: true },
	startDate: {type: Types.Datetime, index: true, default: Date.now},
	notifications:{
		shouldSend:{type: Boolean, default:false},
		clientCount:{type: Number, default: 20}
	},
	endDate: {type: Types.Datetime }
});

Promo.schema.virtual('status').get(function(){
	var now = new Date();
	if(this.startDate > now)
		return "pending";
	else if(this.endDate && this.endDate < now)
		return 'expired';
	else if((!this.startDate || this.startDate < now) && (!this.endDate || now < this.endDate))
		return 'running';
	else 
		return 'unknown';
});

Promo.defaultColumns = 'code, name|20%, discount|10%, discountType, startDate|10%, endDate|10%';
Promo.register();
