var keystone = require('keystone');
var util = require('util');
var Types = keystone.Field.Types;


/*
    Custom FieldType Constructor
    @extends Field
    @api public
*/
function ProductPriceOption(list, path, options) {
	// add your options to this
	// call super_  
	this._nativeType = Types.Relationship;
	ProductPriceOption.super_.call(this, list, path, options);
}

/* inherit Field */
util.inherits(ProductPriceOption, keystone.Field);

/* override or add methods */
ProductPriceOption.prototype.validateInput = function(data) {
	console.log('validate ProductPrice Option');
	var isValid = false;

	if (data && (data.toLower() === 'jeff' || data.toLower() === 'alexander')) {
		isValid = true;
	}

	return isValid;
};

exports = module.exports = ProductPriceOption
