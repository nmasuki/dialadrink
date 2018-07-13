var keystone = require('keystone');
var najax = require('najax');
var async = require('async');
var ProductBrand = keystone.list('ProductBrand');
var ProductCategory = keystone.list('ProductCategory');

var docParser;
try {
	docParser = require('whacko');
} catch (e) {
	docParser = require("cheerio");
}

function importCategories(companyBrands, done) {
	var _categories = companyBrands
		.map(brands => brands.map(b => b.category.toProperCase().trim()))
		.flatten(b => b)
		.distinctBy(b => b.cleanId());

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
							console.log(err, categories, category);
						console.log("Added category " + category.name);
					});
					return category;
				});

			categories = categories.concat(newCategories);
			done(null, categories)
		})
}

function importBrands(companyBrands, companyNames, companyDetails, categories, done) {
	var _brands = companyBrands
		.map(cb => cb.map(c => c.brands).flatten())
		.filter(c => c).flatten()
		.distinctBy(c => c.cleanId())
		.orderBy();

	var filter = {key: {"$in": _brands.map(b => b.cleanId())}};
	ProductBrand.model
		.find(filter)
		.exec((err, brands) => {
			if (err)
				return console.log(err, arguments[1]);

			var newBrands = _brands
				.filter(c => !brands.any(c2 => c2.name.cleanId() == c.cleanId()))
				.map(c => {
					var groups = companyBrands.filter(g => g.any(b => b.brands.any(b2 => b2.cleanId() == c.cleanId())));
					var _companyBrand = groups.map(g => companyBrands[companyBrands.indexOf(g)])
						.first().filter(cb => cb.brands.any(b2 => b2.cleanId() == c.cleanId())).first();
					var category = categories.find(c => c.name.cleanId() == _companyBrand.category.cleanId());

					var company = groups.map(g => {
						var i = companyBrands.indexOf(g);
						return {
							name: companyNames[i].trim(),
							description: companyDetails[i].trim()
						};
					}).first();

					var brand = new ProductBrand.model({
						name: c.toProperCase(),
						category: category,
						company: company
					});

					brand.save(err => {
						if (err)
							console.log(err, categories, brand);
						console.log("Added brand " + brand.name);
					});
					return brand;
				});

			brands = brands.concat(newBrands);
			done(null, brands, newBrands.length);
		});
}

exports = module.exports = function (done) {
	var url = "https://www.eater.com/drinks/2016/1/26/10830410/liquor-brands-hierarchy-diageo-beam-suntory-pernod-ricard";
	najax({
		url: url,
		success: function (html) {
			try {
				if (!html)
					throw "Null response";
				else {
					var $ = docParser.load(html);
					var elems = Array.from($(".c-entry-content h2"));

					var companyNames = elems.map(a => $(a).text());
					var companyDetails = elems.map(a => $(a).next(".unIndentedList").next("p").next(".unIndentedList").next("p").text());
					var companyBrands = elems.map(a => {
						var brandText = $(a).next(".unIndentedList").next("p").next(".unIndentedList").text();
						var brandCatTexts = brandText.split("\n").filter(t => !!t.trim());

						var brandCats = brandCatTexts.map(t => {
							return {
								category: t.substr(0, t.indexOf(":")).toProperCase().trim(),
								brands: t.substr(t.indexOf(":") + 1).split(",").map(b => b.trim())
							}
						})

						return brandCats
					});

					importCategories(companyBrands, function (err, categories) {
						importBrands(companyBrands, companyNames, companyDetails, categories, function (err, brands, updates) {
							if (err)
								return console.warn(err)
							console.log(updates + " brands updated..")
							done(null);
						});
					});
				}
			}
			catch (e) {
				done(Object.assign({status: "error", error: e}))
			}
		}
		,
		error: function (error) {
			console.log("HTTP call failed!", url);

			var body = {status: "error", msg: error.responseText, code: error.statusCode()};
			console.warn(body);

			done(error);
		}
	});
};
