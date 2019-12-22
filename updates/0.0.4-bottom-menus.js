var keystone = require('keystone');
var najax = require('najax');
var async = require('async');
var MenuItem = keystone.list('MenuItem');
var Page = keystone.list('Page');
var baseUrl = keystone.get("url");

var docParser;
try {
	docParser = require('whacko');
} catch (e) {
	docParser = require("cheerio");
}

function importMenus($, elem, parent, index, done) {
	var label, href, a = $($(elem).find("a")[0]);
	var level = parent ? parent.level + 1 : 0;

	if (level == 0) {
		label = "Home";
		href = "/";
	} else {
		label = ($(elem).text() || $(elem).html() || "").trim().split("\n").first().truncate(25, "");
		href = a.attr("href") && a.attr("href").trim() || "#";
	}

	function saveMenu(menu) {
		if (!menu.label)
			done(err, menu);
		else
			menu.save(err => {
				if (err)
					return console.log(err, menu);
				console.log("Added " + menu.type + " menu " + menu.label, "Level:", menu.level, "Index:", menu.index);
				done(err, menu);
			});
	}

	var elems = null;
	if (level === 0) {
		if (a.parents("footer").length)
			elems = Array.from($(elem).parents("footer").find(".container > .row .col-md-3"));
		else
			elems = Array.from($(elem).find("li.nav-item"));
	} else if (a.hasClass("dropdown-toggle")) {
		elems = Array.from($(elem).find("ul.dropdown-menu li"));
	} else if (a.parents("footer").length && $(elem).hasClass("col-md-3")) {
		elems = Array.from($(elem).find("li"));
	}

	MenuItem.model.findOne({href: href, level: level})
		.exec((err, menu) => {
			if (err)
				return console.log(err, arguments[1]);

			if (!menu)
				menu = new MenuItem.model({});

			menu.href = href;
			menu.label = label.trim();
			menu.level = level;
			menu.index = index || 0;
			menu.parent = parent;
			menu.show = true;
			menu.type = parent ? parent.type : "top";

			if ($(elem).parents("footer").length) {
				var bottomMenuColumns = $(elem).parents("footer").find(".container > .row .col-md-3");
				var col = a.parents(".col-md-3");
				if (col.length <= 0) col = $(elem).parents(".col-md-3");
				
				var i = parseInt(bottomMenuColumns.index(col));
				menu.type = "bottom" + (i >= 0 ? " col" + (i + 1) : "");
			} else if (a.parents(".navigation_links").length) {
				menu.type = "top";
			} else {
				console.log("Not sure if top or bottom menu...")
			}

			if (!elems || elems.length <= 0)
				saveMenu(menu);
			else
				elems.forEach((elem, i) => {
					importMenus($, elem, menu, i + 1, function (err, m) {
						menu.submenus.push(m);
						if (i >= elems.length - 1)
							saveMenu(menu)
					})
				});
		});

}

exports = module.exports = function (done) {
	console.log("Loading menus from " + baseUrl);
	najax({
		url: baseUrl,
		success: function (html) {
			try {
				if (!html)
					throw "Null response";

				var $ = docParser.load(html);
				var topMenu = $(".navigation_area .navigation_links");
				var bottomMenu = $("footer .container");

				importMenus($, topMenu, null, 0, function (err, menu) {
					importMenus($, bottomMenu, menu, 0, function (err, m) {
						done(err, m);
					});
				})
			}
			catch (e) {
				done(Object.assign({status: "error", error: e}))
			}
		},
		error: function (error) {
			console.log("HTTP call failed!", baseUrl);

			var body = {status: "error", msg: error.responseText, code: error.statusCode()};
			console.warn(body);

			done(error);
		}
	});
};
