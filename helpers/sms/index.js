
var smsHelpers = {
    mySMS: new (require('./MySMS'))(),
    moveSMS: new (require('./MoveSMS'))(),
    africasTalking: new (require('./AfricasTalkingSMS'))(),
    getInstance: () => {
        return smsHelpers[smsHelpers.key] || smsHelpers.moveSMS;
    }
};

smsHelpers.key = (process.env.SMS_IMPLIMENTATION || "moveSMS").toLowerCase();;
smsHelpers.key = Object.keys(smsHelpers).find(k => k.toLowerCase().startsWith(smsHelpers.key)) || "moveSMS";

console.log("SMS Configured for: " + smsHelpers.key);
if("mySMS".toLowerCase().startsWith((process.env.SMS_IMPLIMENTATION || "move").toLowerCase()))
    smsHelpers.mySMS.init();

module.exports = smsHelpers;