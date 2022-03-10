var keystone = require('./app-init');
var workers = require('./workers');

console.log("Initializing workers for " + (process.env.NODE_ENV || "developer") + " environment...");
//Open DB then start workers
keystone.openDatabaseConnection(console.log);

//Start Background workers a little later
workers.start(2000);