var keystone = require('./app-init');
// Start Keystone to connect to your database and initialise the web server
keystone.start();

require('./workers');