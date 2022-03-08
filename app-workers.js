console.log("Initializing workers for " + (process.env.NODE_ENV || "developer") + " environment...");
var keystone = require('./app-init');
var workers = require('./workers');

//Open DB then start workers
keystone.openDatabaseConnection(console.log);

//Start Background workers a little later
workers.start(process.env.WORK_DELAY * 2);