var keystone = require('keystone');
var najax = require('najax');
var async = require('async');
var url = require('url');
var Crawler = require('../helpers/Crawler');
var MenuItem = keystone.list('MenuItem');
var Page = keystone.list('Page');
var baseUrl = keystone.get("url");

var docParser;
try {
	docParser = require('whacko');
} catch (e) {
	docParser = require("cheerio");
}

var options = {};
var domain = url.parse(baseUrl, true).host;

options[domain] = function ($, uri, json, done) {
	var href = (uri.path.replace(baseUrl, "/").trimRight("/") || "/");

	var skip = [
		//'/', '/home', '/index.html',
		//'/blog/*','/blog/post/*',
		//'/gallery','/contact-us',
		'/login', '/admin*','/blog*',
		'/search/*', '/category/*',
		'/product/*', '/products/*',
		'/cart', '/checkout'
	];

	var match = skip.first(i => new RegExp("^(" + i.escapeRegExp() + ")$", "i").test(href));
	if (match) {
		console.log("Skipping.." + href, "It matched '" + match + "' which is maked to be skipped..");
		return done();
	}

	var h1s = Array.from($("h1"))
		.filter(a => $(a).text())
		.orderBy(a => !/(dial\s*a\s*drink)/i.test($(a).text()) ? 1 : 0);

	var banners = Array.from($(".collection-heading-inner.heading-group"))
		.map(a => $(a).css("background-image"))
		.filter(a => !!a)

	var title = $("title").text().trim()
		.replace(/\ I\ /g, " | ")
		.replace(/\ l\ /g, " | ")
		.replace(/\|/g, "SEPARATOR")
		.replace(/\-/g, " SEPARATOR ")
		.replace(/\s+/g, " ")
		.replace(/(SEPARATOR)+/g, "|")
		.replace(/\s+/g, " ")
		.replace(/(\|\s*\|)+/g, "|");

	var index = title.indexOf("|");
	if (index > 0)
		title = title.substr(0, index) + "-" + title.substr(index + 1);

	console.log("Loading page..", href + ", ", title);
	var pageObj = {
		state: 'published',
		href: (uri.path.replace(baseUrl, "/").trimRight("/") || "/"),
		name: (uri.path.replace(baseUrl, "/").trimRight("/") || "Home").replace(/\W+/g, " ").trim().toProperCase(),
		title: title,
		meta: $("meta[name=description]").attr("content") || title,
		h1: ($(h1s.first()).text() || "").trim(),
		h1s: h1s.map(h1 => $(h1).text()),
		content: $(".home_tab_top").html() || $(".home_featured_content.home-content").html()
	};

	Page.model.findOne({
		href: pageObj.href
	})
		.exec((err, page) => {
			if (err)
				return console.log(err, arguments[1]);

			if (!page)
				page = new Page.model(pageObj);
			else
				page = Object.assign(page, pageObj);

			page.save(err => {
				if (err)
					console.log(err);

				done(err)
			})
		});
};

var crawler = new Crawler(options);
exports = module.exports = function (done) {
	console.log("Starting crawler..");
	crawler.crawl(baseUrl, done);
};

