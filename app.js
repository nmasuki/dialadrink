var keystone = require('./app-init');
var workers = require('./workers');
console.log("Initializing keystone for " + (process.env.NODE_ENV || "developer") + " environment...");
// Start Keystone to connect to your database and initialise the web server
workers.start();
keystone.start();