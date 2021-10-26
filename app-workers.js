var workers = require('./workers');
console.log("Initializing keystone for " + process.env.NODE_ENV + " environment...");
workers.start();