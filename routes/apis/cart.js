var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Product = keystone.list("Product");

var router = keystone.express.Router();

function addToCart(req, res, callback) {
	var id = req.params.id;
	var opt = req.params.opt;
	var pieces = parseInt(req.params.pieces || 1);

	var cartId = id + "|" + opt;
	var cart = req.session.cart || (req.session.cart = {});
	if (cart[cartId]) {

		cart[cartId].pieces += pieces;
		cart[cartId].modifiedDate = new Date();

		//popularity goes up 10x
		Product.findOnePublished({_id: cart[cartId].product._id }, (err, product) => {
			if(err)
				return console.err(err);
			product.addPopularity(10);
			cart[cartId].name = product.name;
		});

		console.log('"Incremented cart item', cartId, cart[cartId].product.name, cart[cartId].quantity, cart[cartId].price, cart[cartId].pieces);
		if (typeof callback == "function")
			callback(cart[cartId], 'added');
		else
			res.send({state: true, msg: "incrementing", new: false, item: cart[cartId]});

	} else {
		Product.findOnePublished({_id: id})
			.exec(function (err, product) {
				if (err || !product)
					return res.send({state: false, msg: "Product not found", err: err});

				var option = product.options.find(o => o.quantity === (opt || product.quantity));
				var price = option.offerPrice && option.price > option.offerPrice? option.offerPrice: option.price;

				cart[cartId] = new CartItem.model({
					product: product,
					price: price,
					quantity: option.quantity,
					pieces: pieces
				});

				//popularity goes up 10x
				product.addPopularity(10);

				console.log('Added cart item', cartId, cart[cartId].product.name, cart[cartId].quantity, cart[cartId].price);

				if (typeof callback == "function")
					callback(cart[cartId], 'added');
				else
					res.send({state: true, msg: "incrementing", new: false, item: cart[cartId]});
			});
	}
}

router.get('/get', function (req, res) {
	var cart = req.session.cart || (req.session.cart = {});
	res.send({state: true, cart: cart, promo: req.session.promo});
});

router.get('/add/:id/:opt', function (req, res) {
	addToCart(req, res, function (cartItem, msg) {
		return res.send({state: true, msg: msg, item: cartItem});
	});
});

router.get('/add/:id/:opt/:pieces', function (req, res) {
	addToCart(req, res, function (cartItem, msg) {
		return res.send({state: true, msg: msg, item: cartItem});
	});
});

router.get('/update/:id/:pieces', function (req, res) {
	var cart = req.session.cart;
	var id = req.params.id;
	var pieces = req.params.pieces;

	if (typeof(cart[id]) != "undefined") {
		console.log("Updating cart", id, 'value', parseInt(pieces));
		cart[id].pieces = parseInt(pieces);
		res.send({state: true, msg: 'success', item: cart[id]});
	} else {
		res.send({state: false, msg: 'Cart not found!!'});
	}

});

router.get('/remove/:id', function (req, res) {
	var id = req.params.id;
	var cart = req.session.cart || {};

	delete cart[id];
	req.session.cart = cart;

	res.send({state: true, msg: "Removed"});
});

router.get('/empty', function (req, res) {
	delete req.session.cart;
	req.session.save();
});

exports = module.exports = router;