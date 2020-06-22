var smsHelpers = {
    moveSMS: new (require('./MoveSMS'))(),
    africasTalking: new (require('./AfricasTalkingSMS'))(),
    mySMS: new (require('./AfricasTalkingSMS'))(),
    getInstance: () => smsHelpers.moveSMS
};

module.exports = smsHelpers;