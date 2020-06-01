/**
 * This script automatically creates a default AppUser user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

exports.create = {
	AppUser: [{
		'name.first': 'Nelson',
		'name.last': 'Masuki',
		'phoneNumber': '254720805835',
		'email': 'nmasuki@gmail.com',
		'username': 'nmasuki',
		'password': 'admin',
		'accountType': "system admin",
		'accountStatus': 'Active',
		'receivesOrders': false
	}, {
		'name.first': 'Simon',
		'name.last': 'Kimari',
		'phoneNumber': '254721750922',
		'email': 'simonkimari@gmail.com',
		'username': 'skimari',
		'password': 'admin',
		'accountType': "office admin",
		'accountStatus': 'Active',
		'receivesOrders': true
	}]
};

/*

// This is the long-hand version of the functionality above:

var keystone = require('keystone');
var async = require('async');
var AppUser = keystone.list('AppUser');

var admins = [
	{ email: 'user@keystonejs.com', password: 'admin', name: { first: 'AppUser', last: 'AppUser' } }
];

function createAdmin (admin, done) {

	var newAdmin = new AppUser.model(admin);

	newAdmin.isAdmin = true;
	newAdmin.save(function (err) {
		if (err) {
			console.warn('Error adding admin ' + admin.email + ' to the database:');
			console.warn(err);
		} else {
			console.log('Added admin ' + admin.email + ' to the database.');
		}
		done(err);
	});

}

exports = module.exports = function (done) {
	async.forEach(admins, createAdmin, done);
};

*/
