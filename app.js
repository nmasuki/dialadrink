// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var handlebars = require('express-handlebars');
require('./helpers/polyfills');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'Dial a Drink Kenya',
	'brand': 'Dial a Drink Kenya',
	'port': 4000,
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': '.hbs',

	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'dialadrink',
		//defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs',
	}).engine,

	'compress': true,
	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'session store': 'mongo',
	'signin logo': '/images/logo-email.gif',
    'cloudinary secure': true
});

//add ProductPriceOption Custom Field Type
Object.defineProperty(
	keystone.Field.Types,
	'ProductPriceOption', {
		get: function () {
			var ppo = require('./helpers/customTypes/ProductPriceOption');
			// or whatever your path is
			return ppo;
		}
	}
);

Object.defineProperty(
	keystone.Field.Types,
	'Array', {
		get: function () {
			var ppo = require('./helpers/customTypes/ObjArrayField/test/explorer');
			// or whatever your path is
			return ppo;
		}
	}
);

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
	enquiries: 'enquiries',
	'content-and-seo': ['menu-items', 'pages'],
	blog: ["blogs", "blog-categories"],
	users: 'users',
});

keystone.set("importUrl", "https://www.dialadrinkkenya.com/");

// Start Keystone to connect to your database and initialise the web server
keystone.start();
