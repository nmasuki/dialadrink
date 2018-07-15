var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * CartItem Model
 * ==========
 */

var CartItem = new keystone.List('CartItem', {
	hidden: true,
	//map: {name: 'quantity'},
	//autokey: {path: 'key', unique: true},
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
    return this.product? this.product.name: null;
});

CartItem.schema.virtual("image").get(function () {
    return this.product.image;
});

CartItem.schema.virtual("price").get(function () {
	var priceOption = this.product.options.find(o => o.quantity === this.quantity);
	return (priceOption || {}).price;
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

//Some random number from which to start counting
var autoId = 72490002;

CartItem.schema.pre('save', function (next) {
	this.orderNumber = autoId + 100;
	next();
});

CartItem.defaultColumns = 'date, product, pieces|20%, quantity|20%';

CartItem.register();

CartItem.model.find().sort({'id': -1}).limit(1)
	.exec(function (err, data) {
		if (data[0] && data[0].orderNumber)
			autoId = data[0].orderNumber;
	});

