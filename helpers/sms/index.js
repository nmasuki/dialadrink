var smsHelpers = {
    moveSMS: new (require('./MoveSMS'))(),
    africasTalking: new (require('./AfricasTalkingSMS'))(),
    mySMS: new (require('./MySMS'))(),
    getInstance: () => smsHelpers.moveSMS
};

module.exports = smsHelpers;