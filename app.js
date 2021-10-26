console.log("Initializing keystone for " + (process.env.NODE_ENV || "developer") + " environment...");

// Start Keystone to connect to your database and initialise the web server
require('./workers').start();
require('./app-init').start();