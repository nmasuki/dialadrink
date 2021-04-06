var keystone = require('./app-init');
console.log("Initializing keystone for " + process.env.NODE_ENV + " environment...");
// Start Keystone to connect to your database and initialise the web server
keystone.start();