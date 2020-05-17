/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var middlewareApi = require('./middleware-api');
var importRoutes = keystone.importer(__dirname);

//Set admin path
keystone.set('admin path', "admin");

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
	apis: importRoutes('./apis'),
};

// Setup Route Bindings
exports = module.exports = function (app) {
	app.enable('view cache');

	// Api endpoints
	var apis = Object.keys(routes.apis).map((i) => { 
		return {
			path: "/api" + (i == "index" ? "" : "/" + i),
			api: routes.apis[i]
		};
	}).orderBy(a => -a.path.length);

	apis.forEach(a => {
		if (a.api && a.api.name == "router") {
			console.log("Registering:", a.path);
			app.use(a.path, middleware.requireAPIUser, middlewareApi.initLocals, a.api);
		}
	});

	// Views
	app.use('/brand', middleware.globalCache, routes.views.brand);
	app.use('/blog', middleware.globalCache, routes.views.blog);
	app.use('/contact-us', middleware.globalCache, routes.views.contact);
	app.use('/gallery', middleware.globalCache, routes.views.gallery);

	app.use('/product', middleware.globalCache, routes.views.product);
	app.use('/category', middleware.globalCache, routes.views.category);
	app.use('/product', middleware.globalCache, routes.views.category);
	app.use('/checkout', routes.views.checkout);
	app.use('/cart', routes.views.cart);

	app.use('/', middleware.globalCache, routes.views.products);
	app.use('/', middleware.globalCache, routes.views.index);

	app.use('/order', routes.views.order);
	app.use('/pesapal', routes.views.pesapal);
	app.use('/africastalking', routes.views.africastalking);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);
};