var smsHelpers = {
    mySMS: new (require('./MySMS'))(),
    moveSMS: new (require('./MoveSMS'))(),
    africasTalking: new (require('./AfricasTalkingSMS'))(),
    getInstance: () => smsHelpers.moveSMS
};

module.exports = smsHelpers;