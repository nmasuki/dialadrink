console.log("Initializing keystone for " + (process.env.NODE_ENV || "developer") + " environment...");

// Start Keystone to connect to your database and initialise the web server
require('./app-init').start();
require('./workers').start();