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
        if(!ppo.product)
            return next();

        var productId = ppo.product._id || ppo.product;
        keystone.list("Product").model.findOne({_id: productId})
            .deepPopulate("priceOptions.option")
            .exec((err, product) => {
                if(err || !product)
                    return next(err);

                var thisOption = product.priceOptions.find(po=>po.option.quality == ppo.quality);

                if(!thisOption)
                    product.priceOptions.push(thisOption = ppo);

                thisOption = Object.assign(thisOption, ppo);
                product.save();

                next(err);
            });
    }

    if (ppo.option && ppo.option.quantity) {
        ppo.optionText = ppo.option.quantity;
        updateProduct(next);
    } else if(ppo.option){
        keystone.list("ProductOption").model.findOne({_id: ppo.option._id || ppo.option})
            .populate('option')
            .exec(function (err, option) {
                if (err || !option)
                    return next(err);

                ppo.optionText = option.quantity;
                updateProduct(next);
            })
    } else if(ppo.optionText){
        var filter = {"$or":[{quantity: ppo.optionText.trim()}, {"key": ppo.optionText.cleanId()}]};
        keystone.list("ProductOption").model.findOne(filter)
            .populate('option')
            .exec(function (err, option) {
                if (err || !option)
                    return next(err);

                ppo.optionText = option.quantity;
                ppo.option = option;
                updateProduct(next);
            })
    }else{
        next();
    }
});

ProductPriceOption.defaultColumns = 'option, product, price, currency';
ProductPriceOption.register();
