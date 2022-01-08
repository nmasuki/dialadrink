var
	_ = require('lodash'),
	htmlToText = require('html-to-text'),
	keystone = require('keystone'),
	nodemailer = require('nodemailer');

var transport;

function buildAddress (email, name) {
	if (name) {
		return name + ' <' + email + '>';
	} else {
		return email;
	}
}

module.exports = function (options, callback) {

	// create transport once
	if (!transport) {
		transport = nodemailer.createTransport(keystone.get('email nodemailer'));
	}

	var locals = options;

	var prepareOptions = [locals];

	if (arguments.length === 3 ) {
		// we expect locals, options, callback
		if (_.isObject(arguments[1])) {
			prepareOptions.push(arguments[1]);
		}
		callback = arguments[2];

	} else if (arguments.length === 2 && !_.isFunction(callback)) {
		// no callback so we expect locals, options
		if (_.isObject(arguments[1])) {
			prepareOptions.push(arguments[1]);
		}
		callback = function(err, info) {// eslint-disable-line no-unused-vars
			if (err) console.log(err);
		};

	} else if (arguments.length === 1) {
		// we expect options here and it is pushed already
		callback = function(err, info){// eslint-disable-line no-unused-vars
			if (err) console.log(err);
		};
	}
	
	send.apply(this, prepareOptions);

};
