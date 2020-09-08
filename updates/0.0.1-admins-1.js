/**
/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

exports.create = {
	Admin: [
		{ 
			'name.first': 'Nelson',
			'name.last': 'Masuki',
			'email': 'nmasuki@gmail.com',
			'password': 'admin',
			'accountType': "system admin",
			'receivesOrders': false
		},
	],
};

/*

// This is the long-hand version of the functionality above:

var keystone = require('keystone');
var async = require('async');
var Admin = keystone.list('Admin');

var admins = [
	{ email: 'user@keystonejs.com', password: 'admin', name: { first: 'Admin', last: 'Admin' } }
];

function createAdmin (admin, done) {

	var newAdmin = new Admin.model(admin);

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
