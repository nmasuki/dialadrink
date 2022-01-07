var keystone = require('keystone');
var Enquiry = keystone.list('Enquiry');
var router = keystone.express.Router();

router.post("/", function (req, res) {
		var view = new keystone.View(req, res);
		var locals = res.locals;

		// Set locals
		locals.page = Object.assign({title: "Contact Us", h1: "Contact Form"}, locals.page || {});
		locals.section = 'contact';
		locals.enquiryTypes = Enquiry.fields.enquiryType.ops;
		locals.formData = req.body || {};
		locals.validationErrors = {};
		locals.enquirySubmitted = false;

		locals.breadcrumbs.push({
			href: "/contact-us",
			label: "Contact Us"
		});

		var newEnquiry = new Enquiry.model();
		var updater = newEnquiry.getUpdateHandler(req);

		view.on("init", next =>{
			updater.process(req.body, {
				flashErrors: true,
				fields: 'name, email, phone, enquiryType, message',
				errorMessage: 'There was a problem submitting your enquiry:',
			}, function (err) {
				if (err) {
					locals.validationErrors = err.errors;
				} else {
					locals.enquirySubmitted = true;
				}
				next();
			});
		});


		view.render('contact');
	});
	
router.get("/", function (req, res) {

		var view = new keystone.View(req, res);
		var locals = res.locals;

		// Set locals
		locals.page = Object.assign({title: "Contact Us", h1: "Contact Form"}, locals.page || {});
		locals.section = 'contact';
		locals.enquiryTypes = Enquiry.fields.enquiryType.ops;
		locals.formData = req.body || {};
		locals.validationErrors = {};
		locals.enquirySubmitted = false;

		locals.breadcrumbs.push({
			href: "/contact-us",
			label: "Contact Us"
		});

		view.render('contact');
	});

exports = module.exports = router;
