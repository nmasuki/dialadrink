var najax = require('najax');
var BaseSMS = require('./MySMS');
var apiUrl = `https://sms.smsafrica.co.ke/sms/v3/{0}`;

var credentials = {
    username: "dialadrink",
    apiKey: process.env.SMSAFRICA_APIKEY || 'kq5aOuGc671t4NVHv0LdPi8z9AKnSIFDBol3pxhsygXrRQfjJZEembMw2UCTWY'
};

function SMSAfrica(sender) {
    sender = sender || process.env.SMSAFRICA_SENDEID || "OTP";
    var self = BaseSMS.call(this);
    var _sendSMS = self.sendSMS;
    var _smsBalance = 0;

    self.getProfile = function () {
        return (_smsBalance = new Promise((resolve, reject) => {
            var url = apiUrl.format('profile');
            console.log("Getting SMS profile..");

            najax.post({
                url: url,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false,
                data: {
                    api_key: credentials.apiKey
                },
                success: function (response) {
                    var json = JSON.parse(response);
                    var res = (json[0] || json);
                     
                    console.log("SMS profile:",  res.status_desc);

                    resolve(res);
                    if (typeof next == "function")
                        next(null, res);
                },
                error: function (xhr, status, error) {
                    console.error("Error getting SMS profile!", error);
                    reject(error);

                    if (typeof next == "function")
                        next(error);
                }
            });
        }));
    };

    self.balance = async function balance() {
        if (_smsBalance instanceof Promise)
            return await _smsBalance;

        if (_smsBalance)
            return _smsBalance;

        _smsBalance = self.getProfile().then(data => {
            var profile = data[0] || data;
            if (profile) {
                var wallet = profile.wallet[0] || profile.wallet;
                console.log("SMS wallet: ", wallet);
                return wallet.credit_balance || 1;
            }

            return 1;
        });

        setTimeout(function () { _smsBalance = 0; }, 10000);
        var balance = await _smsBalance

        return balance;
    };

    self.sendSMS = async function (to, message, date_send) {
        var balance = await self.balance();
        if (balance < 0)
            return console.warn("SMSAfrica account balance is low. Please topup.");

        message = message.replace(/\s{2,}/g, " ");
        var mobileNos = (Array.isArray(to) ? to : [to]).map(t => t.cleanPhoneNumber());
        var client_ref = parseFloat(new Date().getTime().toString().substr(8));
        var messages = mobileNos.map(no => {
            return {
                mobile: no,
                message: message,
                client_ref: ++client_ref
            };
        });

        var options = {
            "serviceId": "0",
            "from": sender,
            "messages": messages,
            "api_key": credentials.apiKey,
        };

        if (date_send) {
            try {
                options.date_send = new Date(date_send).toISOString().substr(0, 19);
            } catch (e) {
                console.warn("Error scheduling SMS for " + date_send);
            }
        }

        return await new Promise((resolve, reject) => {
            var url = apiUrl.format('sendmultiple');
            console.log("Sending SMS..");

            najax.post({
                url: url,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false,
                data: options,
                success: function (response) {
                    var json = JSON.parse(response);
                    console.log("Sending SMS:", json.status_desc);

                    resolve(json);
                    if (typeof next == "function")
                        next(null, json);
                },
                error: function (xhr, status, error) {
                    console.error("Error Sending SMS!", error);
                    reject(error);

                    if (typeof next == "function")
                        next(error);
                }
            });
        });
    }
}

module.exports = SMSAfrica;