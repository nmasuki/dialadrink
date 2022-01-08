console.log("Initializing workers for " + (process.env.NODE_ENV || "developer") + " environment...");
require('./workers').start();