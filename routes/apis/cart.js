var keystone = require('keystone');
var CartItem = keystone.list("CartItem");
var Product = keystone.list("Product");

var router = keystone.express.Router();

function getMergedCart(req, res, callback){
	var client = res.locals.appUser;
	if (!client) 
		return callback(new Error("We could not resolve the logged in user!"));

	var carts = [{}];
	client.getSessions(function(err, sessions){
		const db = keystone.mongoose.connection;
		
		sessions.forEach(s => { 
			if (Object.keys(s.cart || {}).length){
				carts.push(s.cart);
				if (s._id != req.sessionID) {
					delete s.cart;
					db.collection('app_sessions')
						.update({_id: s._id}, { $set: {session: JSON.stringify(s) }});
				}
			}
		});

		var cart = Object.assign.apply(this, carts);
		req.session.cart = cart;

		if(typeof callback == "function")
			callback(null, cart);
	});
}

function updateCartItem(id, pieces, opt, req, res, callback){
	getMergedCart(req, res, function (err, cart) {
		if(err || !cart){
			cart = req.session.cart || (req.session.cart = {});
		}
		
		var cartId = Object.keys(cart).find(key => key.startsWith((id || "").trim()));
		if (!cartId)
			cartId = (id + (opt ? "|" + opt : ""));

		if (cartId && typeof (cart[cartId]) != "undefined") {
			console.log("Updating cart", cartId, 'value', parseInt(pieces));
			cart[cartId].pieces = parseInt(pieces);
			callback(cart[cartId]);
		} else {
			req.params.id = id;
			req.params.opt = opt;
			req.params.pieces = pieces;
			addToCart(req, res, callback);
		}
	});
}

function addToCart(req, res, callback) {
	var productId = req.params.id.split('|')[0];
	var quantity = req.params.opt || req.params.id.split('|')[1];
	var pieces = parseInt(req.params.pieces || 1);

	var cartId = productId + (quantity ? "|" + quantity : "");
	getMergedCart(req, res, function (err, cart) {
		if (err || !cart) {
			cart = req.session.cart || (req.session.cart = {});
		}

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
							return callback(null, "Product not found _id:'" + productId + "'");
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
	});
}

router.get('/get', function (req, res) {
	getMergedCart(req, res, function (err, cart) {
		if (err || !cart) 
			cart = req.session.cart || (req.session.cart = {});
		
		res.send({state: true, cart: cart, promo: req.session.promo});
	});
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

	updateCartItem(id, pieces, req.params.opt, req, res, function (cartItem, msg) {
		return res.send({state: true, msg: msg, item: cartItem});
	});
});

router.post('/update', function (req, res){
	var ids = (typeof(req.body.item_id) == "string") ? [req.body.item_id] : req.body.item_id;
	var pieces = (typeof (req.body.item_pieces) == "string") ? [req.body.item_pieces] : req.body.item_pieces;
	var opts = (typeof (req.body.item_opt) == "string") ? [req.body.item_opt] : req.body.item_opt;

	if (ids.length) {
		var updates = [];
		
		var trackUpdates = function(cartItem, msg) {
			updates.push({msg: msg, cartItem: cartItem});
			if (updates.length >= ids.length) 
				return res.send({ state: true, msg: msg, updates: updates });			
		};

		if(req.query.empty)
			req.session.cart = {};

		for (var i = 0; i < ids.length; i++) 
			updateCartItem(ids[i], pieces[i], opts[i], req, res, trackUpdates);
		
	} else {
		return res.send({ state: false, msg: 'Invalid post data' });
	}
});

router.post('/remove/:id', function (req, res) {
	getMergedCart(req, res, function (err, cart) {
		if (err || !cart)
			cart = req.session.cart || (req.session.cart = {});

		delete cart[req.params.id];
		req.session.cart = cart;

		res.send({state: true, msg: "Removed"});
	});
});

router.post('/empty', function (req, res) {
	getMergedCart(req, res, function (err, cart) {
		delete req.session.cart;
		req.session.save();

		res.send({state: true, msg: "Cleared"});
	});
});

exports = module.exports = router;