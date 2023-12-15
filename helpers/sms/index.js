var smsHelpers = {
    mySMS: new (require('./MySMS'))(),
    moveSMS: new (require('./MoveSMS'))(),
    africasTalking: new (require('./AfricasTalkingSMS'))(),
    smsAfrica: new (require('./SMSAfrica'))(),
    getInstance: () => {
        return smsHelpers[smsHelpers.key] || smsHelpers.moveSMS;
    }
};

var smsHelperKey = (process.env.SMS_IMPLIMENTATION || "moveSMS").toLowerCase();;
smsHelpers.key = Object.keys(smsHelpers).find(k => k.toLowerCase().startsWith(smsHelperKey)) || "moveSMS";

console.log("SMS Configured for: ", smsHelperKey, smsHelpers.key);

for(var key in smsHelpers){
    if (smsHelpers[key] && typeof smsHelpers[key].init == "function"){
        try{
            smsHelpers[key].init();
        } catch(e){
            console.error("Error!", e);
        }
    }
}

module.exports = smsHelpers;