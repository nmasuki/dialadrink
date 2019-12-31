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
    pieces: {type: Number, noedit: true},
    state: {
        type: Types.Select,
        options: 'placed, dispatched, delivered, paid, completed',
        default: 'placed',
        index: true
    },
    product: {type: Types.Relationship, ref: 'Product'},
    name: {type: String},
    quantity: {type: String}
});

CartItem.schema.pre('save', function (next) {
    var pId = this.product && this.product._id || this.product;
    this.name = this.product ? this.product.name : this.name;

    if(this.product && this.product.name)
        return next();
    if(!pId)
        return next();
    
    keystone.list('Product').model.findOne({_id: pId})
        .exec((err, product) => {
            this.name = product && product.name || this._id;
            next();
        });
});

CartItem.schema.virtual("productName").get(function () {
    return this.product ? this.product.name : null;
});

CartItem.schema.virtual("image").get(function () {
    return this.product ? this.product.image: null;
});

CartItem.schema.virtual("price").set(function (value) {
    this._price = value;
});

CartItem.schema.virtual("price").get(function () {
    if(!this.product || !this.product.options)
        return this._price;
        //throw "Missing [product] in cart";

    var priceOption = this.product.options.find(o => o.quantity === this.quantity) || {};
    var price = priceOption.offerPrice && priceOption.price > priceOption.offerPrice
        ? priceOption.offerPrice
        : priceOption.price;
    
    if (price && !this._price)
        this._price = price;

    return price || this._price;
});

CartItem.schema.virtual("currency").get(function () {
    if(!this.product || !this.product.options)
        return 'KES';

    var priceOption = this.product.options.find(o => o.quantity === this.quantity);
    return (priceOption || {}).currency;
});

CartItem.schema.virtual("total").get(function () {
    return this.price * this.pieces;
});

CartItem.schema.virtual("cartId").get(function () {
    return (this.product && (this.product._id || this.product)) + "|" + this.quantity;
});

CartItem.schema.methods.toAppObject = function () {
    var obj = Object.assign(this.toObject(), {
        product: this.product && this.product.toAppObject ? this.product.toAppObject() : {}
    });


    return obj;
};

CartItem.schema.set('toObject', {
    virtual: true,
    transform: function (doc, ret, options) {
        var whitelist = ['cartId', 'date', 'pieces', 'state', 'product', 'quantity', 'image', 'price', 'currency', 'total'];
        whitelist.forEach(i => ret[i] = doc[i]);
        ret._id = (doc.product && doc.product._id) + "|" + doc.quantity;
        return ret;
    }
});

CartItem.schema.set('toJSON', {
    transform: function (doc, ret, options) {
        return doc.toObject();
    }
});

CartItem.defaultColumns = 'date, product, pieces|20%, quantity|20%';
CartItem.register();
