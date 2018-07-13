var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:brand", function (req, res, next) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'store';

	var regex = new RegExp(req.params.brand.trim(), "i");
	var regex2 = new RegExp(req.params.brand.cleanId().trim(), "i");
	locals.filters = {"$or": [{name: regex}, {href: regex2}]};

	locals.page = Object.assign(locals.page, {h1: req.params.brand.toProperCase()});
	if (!locals.page.bannerImages)
		locals.page.bannerImages = [
			"/assets/twall.jpg", "/assets/twall1.jpg", "/assets/twall2.jpg",
			"/assets/twall3.jpg", "/assets/twall4.jpg"
		];

	var title = ""
	keystone.list('Product').findByBrand(locals.filters, (err, products) => {

		if (products && products.length) {
			var i = 0;
			while (products[++i] && title.length < 40)
				title += " - " + products[i].name;

			if (!locals.page.title || locals.page.title == keystone.get("name"))
				locals.page.title = title + " | " + keystone.get("name");

			locals.products = products;
			// Render View
			view.render('products');
		} else
			res.status(404).render('errors/404');
	});


})

module.exports = router;
