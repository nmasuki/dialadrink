/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
var _ = require('lodash');
var keystone = require("keystone");

/**
 Initialises the standard view locals

 The included layout depends on the navLinks array to generate
 the navigation in the header, you may wish to change this array
 or replace it with your own templates / logic.
 */
exports.initLocals = function (req, res, next) {
	//Cart items
	res.locals.cartItems = Object.values(req.session.cart || {}).orderBy(c => c.product.name);
	//Promo code applied
	res.locals.promocode = req.session.promo;
	
	if (req.xhr)
		next();
	
	//Locals only applied to views and not ajax calls
	else {
		//Admin user
		res.locals.user = req.user;
		
		//contact number
		res.locals.contactNumber = "0723688108";

		//To use uglified files in production
		res.locals.dotmin = keystone.get("env") != "development"?".min":"";

		//Load Top Menu
		exports.initTopMenuLocals(req, res, function () {
			//Load BreadCrumbs
			exports.initBreadCrumbsLocals(req, res, function () {
				//Load Page 
				exports.initPageLocals(req, res, function () {
					next();
				})
			})
		})
	}
};

exports.initPageLocals = function (req, res, next) {
	//Load Page details
	res.locals.page = {title: keystone.get("name")}

	var regex = new RegExp("(" + req.originalUrl.cleanId().escapeRegExp() + ")", "i");
	keystone.list('Page').model
		.find({key: regex})
		.exec((err, pages) => {
			var page = pages.orderBy(m => m.href.length).first();

			res.locals.page = Object.assign({title: keystone.get("name")}, page && page.toObject() || {});
			next();
		});
	
}

exports.initBreadCrumbsLocals = function (req, res, next) {
	//Load breadcrumbs
	var regex = new RegExp("(" + req.originalUrl.cleanId().escapeRegExp() + ")", "i");

	keystone.list('MenuItem').model
		.find({key: regex})
		.deepPopulate("parent.parent")
		.exec((err, menus) => {
			var menu = menus.orderBy(m => m.href.length).first();

			var breadcrumbs = [];
			if (menu) {
				do {
					breadcrumbs.push(menu);
				} while (menu = menu.parent);
			}

			if (breadcrumbs.length)
				res.locals.breadcrumbs = breadcrumbs.orderBy(m => m.level);
			else
				res.locals.breadcrumbs = [{"label": "Home", "href": "/"}];

			next();
		})
}

exports.initTopMenuLocals = function (req, res, next) {
	//TopMenu
	keystone.list('MenuItem').model
		.find({level: 1, type: "top"})
		.sort({index: 1})
		.populate('submenus')
		.exec((err, menu) => {
			if (err)
				throw err;

			res.locals.navLinks = menu
				.filter(m => m.show)
				.orderBy(m =>{
					m.submenus = m.submenus.orderBy(n=>n.index);
					return m.index
				})
				.distinctBy(m => m.label.cleanId());

			next();
		});
}


/**
 Fetches and clears the flashMessages before a view is rendered
 */
exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error'),
	};
	res.locals.messages = _.some(flashMessages, function (msgs) {
		return msgs.length;
	}) ? flashMessages : false;
	next();
};


/**
 Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function (req, res, next) {
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
};
