/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */


// Import Products:

var keystone = require('keystone');
var najax = require('najax');
var cloudinary = require("cloudinary");
var Product = keystone.list('Product');
var ProductCategory = keystone.list('ProductCategory');
var ProductSubCategory = keystone.list('ProductSubCategory');
var ProductOption = keystone.list('ProductOption');
var ProductPriceOption = keystone.list('ProductPriceOption');
var baseUrl = keystone.get("importUrl") || "https://www.dialadrinkkenya.com/";

function importCategories(products, done) {
	var _categories = products.map(p => {
		var categories = p.categories;
		categories.push(p.category);
		return categories;
	}).flatten().distinctBy(c => c.cleanId());
	var filter = {key: {"$in": _categories.map(c => c.cleanId())}};
	ProductCategory.model
		.find(filter)
		.exec((err, categories) => {
			if (err)
				return console.log(err, arguments[1]);

			var newCategories = _categories
				.filter(c => !categories.any(c2 => c2.name.cleanId() == c.cleanId()))
				.map(c => {
					var category = new ProductCategory.model({name: c.toProperCase()});
					category.save(err => {
						if (err)
							console.log(err, categories, category, b);
					});
					return category;
				});

			categories = categories.concat(newCategories);
			done(null, categories)
		})
}

function importSubCategories(products, done) {
	var _subcategories = products.map(p => {
		return p.subcategory;
	}).distinctBy(c => c.cleanId());
	var filter = {key: {"$in": _subcategories.map(c => c.cleanId())}};
	ProductSubCategory.model
		.find(filter)
		.exec((err, subcategories) => {
			if (err)
				return console.log(err, arguments[1]);

			var newSubCategories = _subcategories
				.filter(c => c && !subcategories.any(c2 => c2.name.cleanId() == c.cleanId()))
				.map(c => {
					var subcategory = new ProductSubCategory.model({name: c.toProperCase()});
					subcategory.save(err => {
						if (err)
							console.log(err, subcategories, subcategory, b);
					});
					return subcategory;
				});

			subcategories = subcategories.concat(newSubCategories);
			done(null, subcategories)
		})
}

function importOptions(products, done) {
	var _options = products.map(p => {
		return p.options.map(o => o.name).concat(p.quantity)
	})
		.flatten()
		.distinctBy(c => c.cleanId());
	var filter = {key: {"$in": _options.map(c => c)}};
	ProductOption.model
		.find(filter)
		.exec((err, options) => {
			if (err)
				return console.log(err, arguments[1]);

			var newOptions = _options
				.filter(c => !options.any(c2 => c2.quantity.cleanId() == c.cleanId()))
				.map(c => {
					var option = new ProductOption.model({quantity: c});
					option.save(err => {
						if (err)
							console.log(err, option, b);
					});
					return option;
				});

			options = options.concat(newOptions);
			done(null, options)
		})
}

function importProducts(_products, categories, subcategories, options, done) {
	var filter = {href: {"$in": _products.map(p => p.url.split('/').last().trim().cleanId())}};
	Product.findPublished(filter)
		.exec((err, products) => {
			if (err)
				return console.log(err, arguments[1]);

			var popularity = _products.length;
			var newProducts = _products
				.filter(c => !products.any(c2 => c2.name.cleanId() == c.name.cleanId()))
				.map(data => {
					var category = categories.find(c => c.name.cleanId() == data.category.cleanId());
					var subcategory = subcategories.find(c => c.name.cleanId() == data.subcategory.cleanId());

					if (subcategory) {
						subcategory.category = category;
						subcategory.save(err => {
							if (err)
								return console.log(err, subcategory);
						});
					}

					var product = new Product.model({
						name: data.name,
						pageTitle: (data.pageTitle || "").replace(/\ I\ /g, " | "),
						price: data.price,
						state: 'published',
						href: data.url.split('/').last().trim().cleanId(),
						description: data.description,
						category: category,
						subCategory: subcategory,
						//popularity: popularity--,
						onOffer: !!data.categories.find(o => o == "offer"),
						inStock: true,
					});

					var _options = data.options;
					_options.push({name: data.quantity, price: data.price, currency: "KES"});

					var priceOptions = product.priceOptions || (product.priceOptions = []);
					var newOptionPrices = _options
						.filter(c => !priceOptions.any(c2 => c.name.cleanId() == c2.option.quantity.cleanId()))
						.map(c => {
							var option = options.find(o => o.quantity == c.name)
							var optionPrice = new ProductPriceOption.model({
								option: option,
								product: product,
								price: c.price,
								currency: c.currency
							});
							optionPrice.save(err => {
								if (err)
									console.log(err, option, b);
							});
							return optionPrice;
						});

					product.priceOptions = priceOptions.concat(newOptionPrices);

					if (data.image && !data.image.secure_url)
						cloudinary.v2.uploader.upload(data.image,
							{public_id: "products/" + data.name.cleanId()},
							function (error, result) {
								product.image = result;
								product.altImages.push(result);
								product.save(err => {
									if (err)
										return console.log(err, product);
									console.log("Added product " + product.name)
								});
							});

					return product;
				});

			products = products.concat(newProducts);
			done(null, products, newProducts.length)
		});
}

exports = module.exports = function (done) {
	najax.get({
		url: baseUrl.trimRight("/") + "/products.json",
		success: function (products) {
			try {
				if (!products)
					products = {};
				else if (typeof products != "object")
					products = JSON.parse(products) || products;
				//createProduct(body[0], done);

				var success = 0, errors = [], i = 0;
				products = products.orderBy("name");

				importCategories(products, function (err, categories) {
					importSubCategories(products, function (err, subcategories) {
						importOptions(products, function (err, options) {
							importProducts(products, categories, subcategories, options, function (err, products, updates) {
								if (err)
									return console.warn(err);

								console.log(updates + " products updated..");
								setTimeout(done, 100 * updates, null)
							})
						})
					})
				})

			} catch (e) {
				done(Object.assign({status: "error", error: e}, products))
			}
		},
		error: function (error) {
			console.log("HTTP call failed!");

			var body = {status: "error", msg: error.responseText};
			console.warn(body);
			console.log(body);

			done(error);
		}
	})
	;
};


