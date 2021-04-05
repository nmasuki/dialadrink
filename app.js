var keystone = require('./app-init');
var workers = require('./workers');

console.log("Initializing for " + process.env.NODE_ENV + " environment...");

// Start Keystone to connect to your database and initialise the web server
keystone.start();
workers.start();