var credentials = {
    apiKey: process.env.AFRICASTALKING_USER,
    username: process.env.AFRICASTALKING_APIKEY
};

function AfricaTalkingSMS(sender) {
    var AfricasTalking = require("africastalking")(credentials);

    sender = sender || process.env.AFRICASTALKING_SENDEID;
    var self = this;

    self.balance = function balance() {
        return AfricasTalking.APPLICATION.fetchAccount();
    };

    self.send = function () {
        return self.balance().then(response => {
            if (response.userData.balance < 0)
                return console.warn("MoveSMS balance is low. Please topup.");

            var options = {
                to: (Array.isArray(to) ? to : [to]).map(t => t.cleanPhoneNumber()).join(','),
                message: message,
                from: sender
            };

            return AfricasTalking.SMS.send(options)
                .then((response) => {
                    console.log("SMS sent!", response);
                    var code = parseFloat(/[\d]+/.exec(response).pop() || "0");
                    resolve(code);
                    if (typeof next == "function")
                        next(null, code);
                })
                .catch((error) => {
                    console.warn("Error sending SMS!", error);

                    reject(error);
                    if (typeof next == "function")
                        next(error);
                })
                .catch(console.log);
        });
    };

    self.processPayment = function (email, phoneNumber, orderNumber, productName, amount, currency = 'KES', description = 'Online store payment') {
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

        return AfricasTalking.PAYMENTS.mobileCheckout(paymentOptions)
            .then((response) => {
                console.log(JSON.stringify(response, 0, 4));
            })
            .catch((error) => {
                console.log(error);
            });
    };

    self.getPaymentDetails = function (transactionId) {
        return AfricasTalking.PAYMENTS.findTransaction({
            username: credentials.username,
            transactionId: transactionId
        });
    }
}

try {
    module.exports = {
        AfricaTalking: AfricaTalkingSMS,
        Instance: new AfricaTalkingSMS()
    };
} catch (e) {
    console.log("Error while setting up AfricaTalking", e);
}