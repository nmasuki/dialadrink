var keystone = require('./app-init');

var MoveSms = require("./helpers/movesms");
var sms = new MoveSms();

sms.balance().then(console.log).catch(console.error);


// Start Keystone to connect to your database and initialise the web server
//keystone.start();

require('./workers');