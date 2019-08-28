var keystone = require('keystone');

var CartItem = keystone.list("CartItem");
var Product = keystone.list("Product");

var router = keystone.express.Router();

router.get('/', function (req, res) {
	var json = {
		response: "success",
		data: [{
			title: "name",
			value: keystone.get('name')
		}]
	};

	res.send(json);
});

exports = module.exports = router;