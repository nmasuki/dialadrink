// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
require('./helpers/polyfills');

global.Handlebars = require('handlebars');
var handlebars = require('express-handlebars').create({
	handlebars: global.Handlebars,
	partialsDir: 'templates/views/partials',
	layoutsDir: 'templates/views/layouts',
	helpers: new require('./templates/views/helpers')(),
	precompiled: require('./templates'),
	defaultLayout: 'dialadrink',
	extname: '.hbs',
	cache: true,
});


// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'port': process.env.HTTP_PORT || 4000,
	'name': process.env.SITE_NAME || 'Dial A Drink Kenya',
	'url': process.env.SITE_URL || 'https://dialadrinkkenya.com',
	'logo': process.env.SITE_LOGO || 'https://res.cloudinary.com/nmasuki/image/upload/c_fit,w_207,h_50/logo.png',
	'signin logo': process.env.ADMIN_LOGO || 'https://res.cloudinary.com/nmasuki/image/upload/c_fill/logo-email.gif',
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': '.hbs',
	'view cache': true,
	'custom engine': handlebars.engine,
	'compress': true,
	'auto update': true,
	'auth': true,
	'user model': 'User',
	'session': true,
	'session store': 'mongo',
	'session options': {
		cookie: {
			secure: false,
			maxAge: 365 * 24 * 60 * 60 * 1000
		}
	},

	'cloudinary secure': true
});

keystone.pre('routes', keystone.security.csrf.middleware.init);

// Assists with mongoose deepPopullate
keystone.deepPopulate = require('mongoose-deep-populate')(keystone.mongoose);

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));

// Mailing configs
keystone.set('email nodemailer', {
	// Nodemailer configuration
	service: 'Zoho',
	host: process.env.SMTP_HOST,
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.SMTP_USER, // generated ethereal user
		pass: process.env.SMTP_PASS // generated ethereal password
	}
});

// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	products: [
		'products',
		'product-price-options',
		'product-categories',
		'product-sub-categories',
		'product-options',
		'product-brands'
	],
	orders: 'orders',
	payment: 'payments',
	enquiries: 'enquiries',
	'content-and-seo': ['menu-items', 'pages'],
	blog: ["blogs", "blog-categories"],
	users: ['clients', 'users'],
	notifications: ['client-notification-broudcasts', 'client-notifications']
});

//Trust Proxy IP
keystone.set('trust proxy', true);

//Log warning into email
if (!console._warn)
	(function () {
		var email;
		console._log = console.log;
		console._warn = console.warn;
		console._error = console.error;

		function emailToEmail(title, e) {
			try {
				if (!email) {
					email = new keystone.Email('templates/email/error-log');
					//Hack to make use of nodemailer..
					email.transport = require("./helpers/mailer");
				}
				var emailOptions = {
					subject: keystone.get("name") + "-" + title,
					to: {
						name: keystone.get("name") + " Developer",
						email: process.env.DEVELOPER_EMAIL
					},
					from: {
						name: keystone.get("name"),
						email: process.env.EMAIL_FROM
					}
				};

				email.send(e, emailOptions, (err) => {
					if (err)
						return console._warn("Error while sending email.", err.info);
					else
						console._log("Log email notification Sent!");
				});
			} catch (e) {

			}
		}

		console.error = function () {
			emailToEmail("Error!", arguments[0]);

			var args = Array.from(arguments);
			args.unshift(new Date());

			console._error.apply(this, args);
		};

		console.log = function () {
			emailToEmail("Info!", arguments[0]);

			var args = Array.from(arguments);
			args.unshift(new Date());

			console._log.apply(this, args);
		};

		console.warn = function () {
			emailToEmail("Warning!", arguments[0]);

			var args = Array.from(arguments);
			args.unshift(new Date());

			console._warn.apply(this, args);
		};
	});

module.exports = keystone;