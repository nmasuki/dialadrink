var keystone = require('./app-init');
var workers = require('./workers');

// Start Keystone to connect to your database and initialise the web server
//keystone.start();
workers.start();