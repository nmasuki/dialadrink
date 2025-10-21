var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductPriceOption Model
 * ==================
 */
var ProductPriceOption = new keystone.List('ProductPriceOption', {
    singular: 'Product Price',
    prural: 'Product Prices',
    map: {name: 'label'},
});

ProductPriceOption.add({
    option: {type: Types.Relationship, ref: 'ProductOption', many: false},
    product: {type: Types.Relationship, ref: 'Product', many: false},

    currency: {type: String},
    price: {type: Types.Number},
    offerPrice: {type: Types.Number},
    
	inStock: { type: Types.Boolean },

    optionText: {type: String, hidden: true}
});

ProductPriceOption.schema.virtual('percentOffer').get(function () {
    if (this && !!this.offerPrice && this.price > this.offerPrice) {
        var discount = this.price - this.offerPrice;
        var percent = Math.round(100 * discount / this.price);
        return percent || null;
    }

    return null;
});

ProductPriceOption.relationship({ref: 'Product', path: 'product', refPath: 'priceOptions'});
ProductPriceOption.relationship({ref: 'ProductOption', path: 'priceOptions', refPath: 'priceOptions'});

ProductPriceOption.schema.virtual('label').get(function () {
    return `${this.optionText || ''} (${this.currency || 'KES'} ${this.price || ''})`;
});

ProductPriceOption.schema.pre('save', function (next) {
    var ppo = this;

    function updateProduct(next) {
        if (!ppo.product)
            return next();

        var productId = ppo.product._id || ppo.product;
        keystone.list("Product").model.findOne({_id: productId})
            .deepPopulate("priceOptions.option")
            .exec((err, product) => {
                if (err || !product)
                    return next(err);

                product.priceOptions = (product.priceOptions || []).filter(po => po && po.option);
                var thisOption = product.priceOptions.find(po => "" + po.option._id == "" + ppo.option);

                if (!thisOption)
                    product.priceOptions.push(thisOption = ppo);

                //product.priceOptions = product.priceOptions.distinctBy(op => op.option.quantity);
                thisOption.option = ppo.option;
                thisOption.product = ppo.product;

                thisOption.currency = ppo.currency;
                thisOption.price = ppo.price;
                thisOption.offerPrice = ppo.offerPrice;
                thisOption.optionText = ppo.optionText;

                product.save();
                next();
            });
    }

    if (ppo.option && ppo.option.quantity) {
        ppo.optionText = ppo.option.quantity;
        updateProduct(next);
    } else if (ppo.option) {
        keystone.list("ProductOption").model.findOne({_id: ppo.option._id || ppo.option})
            .populate('option')
            .exec(function (err, option) {
                if (err || !option)
                    return next(err);

                ppo.optionText = option.quantity;
                updateProduct(next);
            });
    } else if (ppo.optionText) {
        var filter = {"$or": [{quantity: ppo.optionText.trim()}, {"key": ppo.optionText.cleanId()}]};
        keystone.list("ProductOption").model.findOne(filter)
            .populate('option')
            .exec(function (err, option) {
                if (err || !option)
                    return next(err);

                ppo.optionText = option.quantity;
                ppo.option = option;
                updateProduct(next);
            });
    } else {
        next();
    }
});

ProductPriceOption.defaultColumns = 'option, product, currency, price, offerPrice';
keystone.deepPopulate(ProductPriceOption.schema);
ProductPriceOption.register();
