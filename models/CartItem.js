var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * CartItem Model
 * ==========
 */

var CartItem = new keystone.List('CartItem', {
    hidden: true,
    //map: {name: 'quantity'},
    autokey: {path: 'key', unique: true, from: '_id'},
});

CartItem.add({
    date: {type: Types.Date, index: true, default: Date.now, noedit: true},
    pieces: {type: Number},
    state: {
        type: Types.Select,
        options: 'placed, dispatched, delivered, paid, completed',
        default: 'placed',
        index: true
    },
    product: {type: Types.Relationship, ref: 'Product'},
    quantity: {type: String}
});

CartItem.schema.virtual("productName").get(function () {
    return this.product ? this.product.name : null;
});

CartItem.schema.virtual("image").get(function () {
    return this.product.image;
});

CartItem.schema.virtual("price").get(function () {
    if(!this.product || !this.product.options)
        throw "Missing [product] in cart";

    var priceOption = this.product.options.find(o => o.quantity === this.quantity) || {};
    var price = priceOption.offerPrice && priceOption.price > priceOption.offerPrice
        ? priceOption.offerPrice
        : priceOption.price;

    return price;
});

CartItem.schema.virtual("currency").get(function () {
    var priceOption = this.product.options.find(o => o.quantity === this.quantity);
    return (priceOption || {}).currency;
});

CartItem.schema.virtual("total").get(function () {
    return this.price * this.pieces;
});

CartItem.schema.virtual("cartId").get(function () {
    return (this.product._id || this.product) + "|" + this.quantity;
});

CartItem.schema.set('toObject', {
    virtual: true,
    transform: function (doc, ret, options) {
        var whitelist = ['cartId', 'date', 'pieces', 'state', 'product', 'quantity', 'image', 'price', 'currency', 'total'];
        whitelist.forEach(i => ret[i] = doc[i]);
        ret._id = doc.product._id + "|" + doc.quantity;
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
