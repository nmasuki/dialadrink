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
    var _smsBalance = 0;

    self.balance = function balance(next) {
        if(_smsBalance instanceof Promise)
            return _smsBalance;
        if(_smsBalance)
            return Promise.resolve(_smsBalance);

        setTimeout(function(){ _smsBalance = 0; }, 10000);

        return (_smsBalance = new Promise((resolve, reject) => {
            var url = apiUrl.format('balance');
            console.log("Getting SMS balance..");

            najax.get({
                url: url,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false,
                success: function (response) {
                    var numbers = /[\d]+/.exec(response);
                    _smsBalance = parseFloat(numbers.pop() || "0");

                    if(_smsBalance)
                        console.log("SMS balance:", _smsBalance);
                    else
                        console.error("SMS balance:", _smsBalance);

                    resolve(_smsBalance);

                    if (typeof next == "function")
                        next(null, _smsBalance);
                },
                error: function (xhr, status, error) {
                    console.error("Error getting SMS balance!", error);
                    reject(error);
                    
                    if (typeof next == "function")
                        next(error);
                }
            });
        }));
    };
   
    var sendPromise = null;
    self.sendSMS = async function compose(to, message, next) {
        var url = apiUrl.format('compose') + `&sender=${sender}`;

        var balance = await self.balance();
        if (balance < 0)
            console.error(`MoveSMS balance is low [${balance}]. Please topup.`);
        
        if (process.env.NODE_ENV != "production") {
            var err = "Ignoring SMS notification for non-prod environment!";
            console.warn(err + "\r\n------SMS------\r\n" + to + ":\r\n" + message + "\r\n------");                
            return await _sendSMS.call(this, to, message, next);
        }

        var numbers = (Array.isArray(to) ? to : [to]).map(t => t.cleanPhoneNumber());
        var values = await Promise.all(numbers.map(n => self.validateNumber(n)));
        var validNos = numbers.filter((n, i) => values[i].valid);

        if (!validNos.length) {
            var err = "Ignoring SMS notification for invalid numbers! " + numbers.join();
            if (typeof next == "function")
                next(err);
            if(err)
                console.error(err);
        }

        if (validNos.length < numbers.length)
            console.warn("Some invalid numbers found! Not sending sms to these: '" + numbers.filter((n, i) => values[i].valid).join() + "' !");

        var sendFxn = ((resolve, reject) => {
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
                resolve(--_smsBalance);

                if (typeof next == "function")
                    next(null, _smsBalance);
            }).fail(function (error) {
                console.error("Http error:", error);
                reject(error);

                if (typeof next == "function")
                    next(error);
            });
        });

        if(sendPromise)
            sendPromise.then(() => new Promise(sendFxn));
        else 
            sendPromise = new Promise(sendFxn);

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