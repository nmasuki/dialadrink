var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductPriceOption Model
 * ==================
 */
var ProductPriceOption = new keystone.List('ProductPriceOption', {
	//hidden: true,
	singular: 'Product Price',
	prural: 'Product Prices',
	map: { name: 'label' },
});

ProductPriceOption.add({
	option: { type: Types.Relationship, ref: 'ProductOption', many: false },
	product: { type: Types.Relationship, ref: 'Product', many: false },
	price: { type: Types.Number },
	currency: { type: String },

	optionText: { type: String }
});

ProductPriceOption.relationship({ ref: 'Product', path: 'product', refPath: 'priceOptions' });
ProductPriceOption.relationship({ ref: 'ProductOption', path: 'priceOptions', refPath: 'priceOptions' });

ProductPriceOption.schema.virtual('label').get(function () {
	return `${this.optionText} (${this.currency || 'KES'} ${this.price})`;
})

ProductPriceOption.schema.pre('save', function (next) {
	var ppo = this;

	if (this.option && this.option.quantity) {
		this.optionText = this.option.quantity;
		next()
	} else {
		ProductPriceOption.model.findOne({ _id: this._id })
			.populate('option')
			.exec(function (err, option) {
				if (err || !option)
					return next(err);

				this.optionText = option.quantity;
				next();
			})
	}
});

ProductPriceOption.defaultColumns = 'option, product, price, currency';
ProductPriceOption.register();
