var najax = require('najax');
var BaseSMS = require('./MySMS');
var apiUrl = `https://sms.movesms.co.ke/api/{0}?username=${process.env.MOVESMS_USERNAME}&api_key=${process.env.MOVESMS_APIKEY}`;
    
najax.defaults({
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
});

module.exports = function MoveSMS(sender) {
    sender = sender || 'SMARTLINK';
    
    var self = BaseSMS.call(this);
    var _sendSMS = self.sendSMS;

    var _balance = 0;
    self.balance = function balance(next) {
        if(_balance)
            return Promise.resolve(_balance);

        setTimeout(function(){ _balance = 0; }, 10000);

        return new Promise((resolve, reject) => {
            var url = apiUrl.format('balance');
            console.log("Getting SMS balance..");

            najax.get({
                url: url,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false,
                success: function (response) {
                    _balance = parseFloat(/[\d]+/.exec(response).pop() || "0");
                    console.log("SMS balance:", _balance);
                    resolve(_balance);

                    if (typeof next == "function")
                        next(null, _balance);
                },
                error: function (xhr, status, error) {
                    console.error("Error getting SMS balance!", error);
                    reject(error);
                    if (typeof next == "function")
                        next(error);
                }
            });
        });
    };
   
    self.sendSMS = function compose(to, message, next) {
        var url = apiUrl.format('compose') + `&sender=${sender}`;

        return self.balance().then(function (balance) {
            var err = "";
            
            if (balance < 0)
                return console.error("MoveSMS balance is low. Please topup.");

            if (process.env.NODE_ENV != "production") {
                err = "Ignoring SMS notification for non-prod environment!";
                console.warn(err + "\r\n------SMS------\r\n" + to + ":\r\n" + message + "\r\n------");                
                return _sendSMS.call(this, to, message, next);
            }

            var numbers = (Array.isArray(to) ? to : [to]).map(t => t.cleanPhoneNumber());
            return Promise.all(numbers.map(n => self.validateNumber(n))).then(values => {
                var validNos = numbers.filter((n, i) => values[i].valid);

                if (!validNos.length) {
                    var err = "Ignoring SMS notification for invalid numbers! " + numbers.join();
                    if (typeof next == "function")
                        next(err);

                    return Promise.reject(err);
                }

                if (validNos.length < numbers.length)
                    console.warn("Some invalid numbers found! Not sending sms to these: '" + numbers.filter((n, i) => values[i].valid).join() + "' !");

                return new Promise((resolve, reject) => {
                    console.log("Sending SMS request..");
                    najax.post({
                        url: url,
                        data: {
                            to: validNos.join(','),
                            message: message.replace(/\s{2,}/g, " "),
                            msgtype: 5,
                            dlr: 0
                        },
                        rejectUnauthorized: false,
                        requestCert: true,
                        agent: false,
                    }).then(function (response) {
                        console.log("SMS request sent. Http response:", response);                    
                        resolve(--balance);

                        if (typeof next == "function")
                            next(null, balance);
                    }).fail(function (error) {
                        console.error("Http error:", error);
                        reject(error);

                        if (typeof next == "function")
                            next(error);
                    });
                });
            });
        }).catch(function (error) {
            return console.error("Can't send SMS!", error);
        });

    };

    self.schedule = function schedule(date, to, message, next) {
        return new Promise((resolve, reject) => {
            var url = apiUrl.format('schedule') + `&sender=${sender}`;
            najax.post({
                url: url,
                data: {
                    to: (Array.isArray(to) ? to : [to]).map(t => t.cleanPhoneNumber()).join(','),
                    scheduletime: date.toISOString(),
                    message: message,
                    msgtype: 5,
                    dlr: 0
                },      
                rejectUnauthorized: false,
                requestCert: true,
                agent: false,          
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
};