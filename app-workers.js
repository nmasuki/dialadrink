var workers = require('./workers');
console.log("Initializing workers for " + (process.env.NODE_ENV || "developer") + " environment...");
workers.start();