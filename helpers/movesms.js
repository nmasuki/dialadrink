var najax = require('najax');

module.exports = function MoveSMS(sender) {
    sender = sender || 'SMARTLINK';
    var self = this;
    var apiUrl = `https://sms.movesms.co.ke/api/{0}?username=${process.env.MOVESMS_USERNAME}&api_key=${process.env.MOVESMS_APIKEY}`;

    self.balance = function balance(next) {
        return new Promise((resolve, reject) => {
            var url = apiUrl.format('balance');
            najax.get({
                url: url,
                success: function (response) {
                    var balance = parseFloat(/[\d]+/.exec(response).pop() || "0");
                    resolve(balance);
                    if (typeof next == "function")
                        next(null, balance);
                },
                error: function (error) {
                    reject(error);
                    if (typeof next == "function")
                        next(error);
                }
            });
        });
    };

    self.send = function compose(to, message, next) {
        var url = apiUrl.format('compose') + `&sender=${sender}`;

        return self.balance().then(function (balance) {
            if (balance < 0)
                return console.warn("MoveSMS balance is low. Please topup.");

            return new Promise((resolve, reject) => {
                najax.post({
                    url: url,
                    data: {
                        to: (Array.isArray(to) ? to : [to]).join(','),
                        message: message,
                        msgtype: 5,
                        dlr: 0
                    },
                    success: function (response) {
                        console.log("SMS notification sent!", response);

                        var balance = parseFloat(/[\d]+/.exec(response).pop() || "0");
                        resolve(balance);
                        if (typeof next == "function")
                            next(null, balance);
                    },
                    error: function (error) {
                        console.error("Error sending SMS!", error);

                        reject(error);
                        if (typeof next == "function")
                            next(error);
                    }
                });
            });
        }).catch(function(){
            return console.warn("Can't send SMS!", err);
        });

    };

    self.schedule = function schedule(date, to, message, next) {
        return new Promise((resolve, reject) => {
            var url = apiUrl.format('schedule') + `&sender=${sender}`;
            najax.post({
                url: url,
                data: {
                    to: (Array.isArray(to) ? to : [to]).join(','),
                    scheduletime: date.toISOString(),
                    message: message,
                    msgtype: 5,
                    dlr: 0
                },
                success: function (response) {
                    resolve(response);
                    if (typeof next == "function")
                        next(null, response);
                },
                error: function (error) {
                    reject(error);
                    if (typeof next == "function")
                        next(error);
                }
            });
        });
    };
}