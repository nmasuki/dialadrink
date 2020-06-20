var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * CartItem Model
 * ==========
 */

var CartItem = new keystone.List('CartItem', {
    hidden: true,
    map: {name: 'name'},
    autokey: {path: 'key', unique: true, from: '_id'},
});

CartItem.add({
    date: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    modifiedDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    
    name: {type: String},    
    pieces: {type: Number, noedit: true},
    
    quantity: {type: String},
    price: {type: Number, noedit: true},
    offerPrice: {type: Number, noedit: true},
    
    product: {type: Types.Relationship, ref: 'Product'},

    state: {
        type: Types.Select,
        options: 'placed, dispatched, delivered, paid, completed',
        default: 'placed',
        index: true
    }
});

CartItem.schema.pre('save', function (next) {
    var that = this;

    var pId = that.product && that.product._id || that.product;
    that.name = that.productName;

    if (that.name)
        return next();
    if(!pId)
        return next();
    
    keystone.list('Product').model.findOne({_id: pId})
        .exec((err, product) => {
            that.name = product && product.name || that._id;
            next();
        });
});

CartItem.schema.virtual("priceOption").get(function () {
    var priceOption = {
        quantity: this.quantity,
        price: this.price,
        offerPrice: this.offerPrice
    };

    if (priceOption.price > 0)
        return priceOption;

    var item = this;

    if (item.product){
        priceOption = item.product.options.find(o => o.quantity === item.quantity) || item.product.cheapestOption;    
    
        if(priceOption){
            this.price = priceOption.price;
            this.offerPrice = priceOption.offerPrice;
            this.save();
        }
    }

    return priceOption;
});

CartItem.schema.virtual("productName").get(function () {
    return this.product ? this.product.name : null;
});

CartItem.schema.virtual("image").get(function () {
    return this.product ? this.product.image: null;
});

CartItem.schema.virtual("total").get(function () {
    return this.price * this.pieces;
});

CartItem.schema.virtual("cartId").get(function () {
    return (this.product && (this.product._id || this.product)) + "|" + this.quantity;
});

CartItem.schema.methods.toAppObject = function () {
    var priceOption = this.priceOption;
    
    var obj = Object.assign(this.toObject(), {
        currency: priceOption.currency,
        price: priceOption.price,
        offerPrice: priceOption.offerPrice,
        quantity: priceOption.quantity,
        //product: this.product && this.product.toAppObject ? this.product.toAppObject() : null,
        productId: (this.product && this.product._id).toString()
    });

    delete obj.product;
    return obj;
};

CartItem.schema.set('toObject', {
    virtual: true,
    transform: function (doc, ret, options) {
        var whitelist = ['cartId', 'date', 'pieces', 'state', 'product', 'image', 'quantity', 'price', 'offerPrice', 'currency', 'total'];
        whitelist.forEach(i => ret[i] = doc[i]);
        if(doc.product._id)
            ret.productId = doc.product._id;
        return ret;
    }
});

CartItem.schema.set('toJSON', {
    transform: function (doc, ret, options) {
        return doc.toObject();
    }
});

CartItem.defaultColumns = 'date, product|20%, quantity|20%, pieces, price';
CartItem.register();
