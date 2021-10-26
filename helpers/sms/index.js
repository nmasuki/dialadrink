var smsHelpers = {
    mySMS: new (require('./MySMS'))(),
    moveSMS: new (require('./MoveSMS'))(),
    africasTalking: new (require('./AfricasTalkingSMS'))(),
    getInstance: () => {
        var key = (process.env.SMS_IMPLIMENTATION || "moveSMS").toLowerCase();
        key = Object.keys(smsHelpers).find(k => k.toLowerCase().startsWith(key)) || "moveSMS";
        return smsHelpers[key] || smsHelpers.moveSMS;
    }
};

module.exports = smsHelpers;