var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:category", function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'store';
	locals.filters = {
		category: req.params.category
	};

	locals.page = Object.assign(locals.page, {h1: locals.filters.category.toProperCase()});
	if (!locals.page.bannerImages)
		locals.page.bannerImages = [
			"/assets/twall.jpg", "/assets/twall1.jpg", "/assets/twall2.jpg",
			"/assets/twall3.jpg", "/assets/twall4.jpg"
		];


	// Load Products
	view.on('init', function (next) {
		keystone.list('ProductCategory').model.find({key: locals.filters.category.cleanId()})
			.exec((err, categories) => {
				var title = categories.map(c => c.name).join(" - ");
				var filter = {category: {"$in": categories.map(c => c._id)}};
				keystone.list('Product').findPublished(filter, (err, products) => {
					
					var i = 0
					while(products[++i] && title.length < 40)
						title += " - " + products[++i].name;
					
					if(!locals.page.title|| locals.page.title == keystone.get("name"))
						locals.page.title = title + " | " + keystone.get("name");

					locals.products = products;
					next();
				});
			});
	});

	// Render View
	view.render('products');
})

router.get("/:category/:subcategory", function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.filters = {
		category: req.params.category,
		subcategory: req.params.subcategory
	};

	locals.page = Object.assign(locals.page, {h1: locals.filters.category.toProperCase()});
	if (!locals.page.bannerImages)
		locals.page.bannerImages = [
			"/assets/twall.jpg", "/assets/twall1.jpg", "/assets/twall2.jpg",
			"/assets/twall3.jpg", "/assets/twall4.jpg"
		];

	// Load Products
	view.on('init', function (next) {
		keystone.list('ProductSubCategory').model.find({key: locals.filters.subcategory.cleanId()})
			.exec((err, subCategories) => {
				var title = subCategories.map(c => c.name).join(" - ");
				var filter = {subCategory: {"$in": subCategories.map(c => c._id)}};
				keystone.list('Product').findPublished(filter, (err, products) => {
					
					var i = 0;
					while(products[++i] && title.length < 40)
						title += " - " + products[i].name;
					
					if(!locals.page.title|| locals.page.title == keystone.get("name"))
						locals.page.title = title + " | " + keystone.get("name");
					
					locals.page.h1 = subCategories.first().name;
					locals.products = products;
					next();
				});
			});
	});

	// Render View
	view.render('products');
})

exports = module.exports = router;
