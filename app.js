console.log("Initializing keystone for " + (process.env.NODE_ENV || "developer") + " environment...");

// Start Keystone to connect to your database and initialise the web server
require('./app-init').start();

//Start Background workers a little later
setTimeout(function(){ require('./workers').start(); }, 60000);