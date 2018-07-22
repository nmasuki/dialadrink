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
    map: {name: 'label'},
});

ProductPriceOption.add({
    option: {type: Types.Relationship, ref: 'ProductOption', many: false},
    product: {type: Types.Relationship, ref: 'Product', many: false},
    price: {type: Types.Number},
    currency: {type: String},

    optionText: {type: String, hidden: true}
});

ProductPriceOption.relationship({ref: 'Product', path: 'product', refPath: 'priceOptions'});
ProductPriceOption.relationship({ref: 'ProductOption', path: 'priceOptions', refPath: 'priceOptions'});

ProductPriceOption.schema.virtual('label').get(function () {
    return `${this.optionText || ''} (${this.currency || 'KES'} ${this.price || ''})`;
})

ProductPriceOption.schema.pre('save', function (next) {
    var ppo = this;

    function updateProduct(next) {
        var productId = this.product._id || this.product;
        keystone.list("Product").model.findOne({_id: productId})
            .deepPopulate("priceOptions.option")
            .exec((err, product) => {
                if(err)
                    console.error(err);

                var thisOption = product.priceOptions.find(po=>po.option.quality == ppo.quality);

                if(!thisOption)
                    product.priceOptions.push(thisOption = ppo);

                thisOption = Object.assign(thisOption, ppo);

                product.save();
                next(err);
            });
    }

    if (this.option && this.option.quantity) {
        this.optionText = this.option.quantity;
        updateProduct(next);
    } else {
        keystone.list("ProductOption").model.findOne({_id: this.option._id || this.option})
            .populate('option')
            .exec(function (err, option) {
                if (err || !option)
                    return next(err);

                ppo.optionText = option.quantity;
                updateProduct(next);
            })
    }
});

ProductPriceOption.defaultColumns = 'option, product, price, currency';
ProductPriceOption.register();
