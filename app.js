var keystone = require('./app-init');

console.log("Initializing keystone for " + (process.env.NODE_ENV || "developer") + " environment...");

// Add process handlers for debugging
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start Keystone to connect to your database and initialise the web server
keystone.start();