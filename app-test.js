require("./helpers/polyfills");

var sms = new (require("./helpers/sms/SMSAfrica"))();

sms.balance().then(console.log)
sms.sendSMS("254720805835", "Testing SMSAfrica!");
sms.sendSMS("254720805835", "Testing scheduled SMSAfrica!", new Date().addMinutes(2));