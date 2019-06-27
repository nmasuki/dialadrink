var keystone = require('keystone');
var pesapalHelper = require('../../helpers/pesapal');

var router = keystone.express.Router();

var Page = keystone.list("Page");
var Order = keystone.list("Order");
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");

var Blog = keystone.list("Blog");

module.exports = router;