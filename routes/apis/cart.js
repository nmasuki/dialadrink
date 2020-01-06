var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Product = keystone.list("Product");

var router = keystone.express.Router();

function updateCartItem(id, pieces, req, res, callback){
	var cart = req.session.cart || (req.session.cart = {});
	var cartId = Object.keys(cart).find(key => key.startsWith((id || "").trim()));

	if (cartId && typeof(cart[cartId]) != "undefined") {
		console.log("Updating cart", cartId, 'value', parseInt(pieces));
		cart[cartId].pieces = parseInt(pieces);
		callback(cart[cartId]);
	} else {
		addToCart(req, res, callback);
	}
}

function addToCart(req, res, callback) {
	var productId = req.params.id.split('|')[0];
	var quantity = req.params.opt || req.params.id.split('|')[1];
	var pieces = parseInt(req.params.pieces || 1);

	var cartId = productId + (quantity ? "|" + quantity : "");
	var cart = req.session.cart || (req.session.cart = {});

	if (cart[cartId]) {
		cart[cartId].pieces += pieces;
		cart[cartId].modifiedDate = new Date();

		//popularity goes up 10x
		Product.findOnePublished({_id: cart[cartId].product._id }, (err, product) => {
			if (err || !product)
				return console.log("Product not found", err);
			
			product.addPopularity(10);
			cart[cartId].name = product.name;
		});

		console.log('"Incremented cart item', cartId, cart[cartId].product.name, cart[cartId].quantity, cart[cartId].price, cart[cartId].pieces);
		if (typeof callback == "function")
			return callback(cart[cartId], 'added');
		else
			return res.send({state: true, msg: "incrementing", new: false, item: cart[cartId]});

	} else {
		Product.findOnePublished({_id: productId})
			.exec(function (err, product) {
				if (err || !product){
					if (typeof callback == "function")
						return callback(null, "Product not found");
					else
						return res.send({state: false, msg: "Product not found", err: err});
				}
				var option = product.options.find(o => o.quantity === (quantity || product.quantity));
				var price = option.offerPrice && option.price > option.offerPrice? option.offerPrice: option.price;

				cart[cartId] = new CartItem.model({
					price: price,
					product: product,
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
	var id = req.params.id || "1";
	var pieces = parseInt(req.params.pieces || 1);

	updateCartItem(id, pieces, req, res, function(cartItem, msg){
		return res.send({state: true, msg: msg, item: cartItem});
	});
});

router.post('/update', function (req, res){
	var ids = (typeof(req.body.item_id) == "string") ? [typeof req.body.item_id] : typeof req.body.item_id;
	var pieces = (typeof(req.body.item_pieces) == "string") ? [typeof req.body.item_pieces] : typeof req.body.item_pieces;
	
	if (ids.length) {
		var updates = [];
		
		var trackUpdates = function(cartItem, msg) {
			updates.push({msg: msg, cartItem: cartItem});
			if (updates.length >= ids.length) {
				return res.send({ state: true, msg: msg, update: updates });
			}
		};

		for (var i = 0; i < ids.length; i++) 
			updateCartItem(ids[i], pieces[i], req, res, trackUpdates);
		
	} else {
		return res.send({ state: false, msg: 'Invalid post data' });
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