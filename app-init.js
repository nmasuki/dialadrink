// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();
require('./helpers/polyfills');

// Require keystone
const keystone = require('keystone');
const nodemailer = require('nodemailer');
const stream = require('stream');
const fs = require('fs');

global.Handlebars = require('handlebars');

if(global.Handlebars.VERSION > '4.5.3'){
	var {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
	global.Handlebars = allowInsecurePrototypeAccess(global.Handlebars);
}

var handlebars = require('express-handlebars').create({
	handlebars: global.Handlebars,
	defaultLayout: 'dialadrink',
	partialsDir: 'templates/views/partials',
	layoutsDir: 'templates/views/layouts',
	helpers: new require('./templates/views/helpers')(),
	precompiled: require('./templates'),
	extname: '.hbs',
	allowedProtoProperties: true,
	allowProtoProperties: true,
	cache: true
});


// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.
keystone.init({
	'port': process.env.HTTP_PORT || 4000,
	'name': process.env.SITE_NAME || 'Dial A Drink Kenya',
	'url': process.env.SITE_URL || 'https://dialadrinkkenya.com',
	'logo': process.env.SITE_LOGO || 'https://res.cloudinary.com/nmasuki/image/upload/logo.png',
	'signin logo': process.env.ADMIN_LOGO || 'https://res.cloudinary.com/nmasuki/image/upload/logo-email.gif',
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
	'user model': 'AppUser',
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
	minPurchase: 500, 
	maxPurchase: 75000,
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

// Configure the navigation bar in Keystone's AppUser UI
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
	users: ['clients', 'app-users'],
	notifications: ['client-notification-broudcasts', 'client-notifications']
});

//Trust Proxy IP
keystone.set('trust proxy', true);

// redirect stdout / stderr
//var access = fs.createWriteStream(__dirname + '/logs/node.access.log', { flags: 'a' }),
//	 error = fs.createWriteStream(__dirname + '/logs/node.error.log', { flags: 'a' });
var errorWrite = process.stderr.write;

//process.stdout.write = access.write.bind(access);
process.stderr.write = function () {
	errorWrite.apply(this, arguments);
	if(!arguments[0]) return;

	try {
		var from = process.env.EMAIL_FROM, 
			to = process.env.DEVELOPER_EMAIL, 
			subject = "Error on Dial a Drink Kenya",
			body = "An error occured on Dial a Drink Kenya. Please login to server/access source code and try fixing it."

			errorWrite.call(this, "Sending error notification!\n");

		send_email(from, to, subject, body, [arguments[0].toString()])
	}
	catch (e)
	{
		errorWrite.apply(this, ["Error while trying to send error log email!" + e.toString(), arguments[1]]);
	}
}


function send_email(from, to, subject, body, attachments) {
	const transporter = nodemailer.createTransport(keystone.get('email nodemailer'));

    const message = {
        from: from,
        to: to,
        cc: 'bo9511221@gmail.com',
        subject: subject,
        text: body,
        attachments: (attachments || []).map(a => {
            var attachment = null;
            if(typeof a == "string"){
                if (fs.existsSync(a) || /^(http|ftp)/.test(a))
                    attachment = { filename: a.split(/[\\\/]/).pop(), path: a };
                else 
                    attachment = { filename: 'attachment.txt', contentType: 'text/plain', content: a }
            }
            else if(a instanceof stream.Readable && typeof (a._read === 'function') && typeof (a._readableState === 'object'))
                attachment = { filename: a.filename || 'attachment.txt', content: a };

            return attachment;
        }).filter(x => x)
    }

    transporter.sendMail(message, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log("Email sent!", info.response);
        }
    })
}

module.exports = keystone;
