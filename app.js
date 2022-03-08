var keystone = require('./app-init');
var workers = require('./workers');

console.log("Initializing keystone for " + (process.env.NODE_ENV || "developer") + " environment...");

// Start Keystone to connect to your database and initialise the web server
keystone.start();

//Start Background workers a little later
if (process.env.NODE_ENV != "production")
    workers.start((process.env.WORK_DELAY || 5000) * 2);