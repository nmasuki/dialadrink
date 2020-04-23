var BaseSMS = require('./MySMS');

var credentials = {
    username: process.env.AFRICASTALKING_USER || "dialadrink",
    apiKey: process.env.AFRICASTALKING_APIKEY || '8e42f0b0477b3c1312997e33fd698f2d8e27fc609b9f323cb5237fb8d46f50ff'
};

function AfricaTalkingSMS(sender) {
    var AfricasTalking = require("africastalking")(credentials);

    sender = sender || process.env.AFRICASTALKING_SENDEID || 'DIALADRINK';
    var self = BaseSMS.call(this);

    self.balance = function balance() {
        return AfricasTalking.APPLICATION.fetchAccount().then(response=> {
            var balance = parseFloat(response.UserData.balance.split(' ')[1]);
            return Promise.resolve(balance);
        });
    };

    self.sendSMS = function (to, message) {
        return self.balance().then(balance => {
            if (balance < 0)
                return console.warn("AfricaTalking account balance is low. Please topup.");

            var options = {
                to: (Array.isArray(to) ? to : [to]).map(t => '+' + t.cleanPhoneNumber()),
                message: message,
                from: sender
            };

            return AfricasTalking.SMS.send(options)
                .then((response) => {
                    console.log("SMS sent!", response);
                    var cost = parseFloat(/([\d]+\.[\d]+)/.exec(response.SMSMessageData.Message).pop() || "0");
                    resolve(cost);
                    if (typeof next == "function")
                        next(null, code);
                })
                .catch((error) => {
                    console.warn("Error sending SMS!", error, options);

                    reject(error);
                    if (typeof next == "function")
                        next(error);
                })
                .catch(console.log);
        });
    };

    self.processPayment = function (phoneNumber, orderNumber, productName, amount, currency = 'KES', description = 'Online store payment', email = null) {
        var paymentOptions = {
            productName: productName,
            phoneNumber: phoneNumber,
            amount: amount,
            currencyCode: currency || 'KES',
            narration: description || 'Online store payment',
            metadata: {
                orderNumber: orderNumber
            },
        };

        if (email)
            paymentOptions.customerEmail = email;

        console.log("Calling AfricasTalking.PAYMENTS.mobileCheckout()", paymentOptions);
        return AfricasTalking.PAYMENTS.mobileCheckout(paymentOptions)
            .then((response) => {
                console.log(JSON.stringify(response, 0, 4));
            })
            .catch((error) => {
                console.warn(error);
            });
    };

    self.getPaymentDetails = function (transactionId) {
        return AfricasTalking.PAYMENTS.findTransaction({
            username: credentials.username,
            transactionId: transactionId
        });
    };
}

module.exports = AfricaTalkingSMS;