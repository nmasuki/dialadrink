var BaseSMS = require('./MySMS');
var ls = require('../LocalStorage').getInstance("atsms");

var credentials = {
    username: process.env.AFRICASTALKING_USER || "dialadrink",
    apiKey: process.env.AFRICASTALKING_APIKEY || '8e42f0b0477b3c1312997e33fd698f2d8e27fc609b9f323cb5237fb8d46f50ff'
};

function AfricaTalkingSMS(sender) {
    var AfricasTalking = require("africastalking")(credentials);

    sender = sender || process.env.AFRICASTALKING_SENDEID;
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
                message: message.replace(/\s{2,}/g, " ")
            };

            if(sender)
                options.from = sender;

            return AfricasTalking.SMS.send(options)
                .then((response) => {
                    console.log("SMS sent!", response);

                    var data = (response || {}).SMSMessageData || {};                    
                    var record = Object.assign({}, {
                        to: options.to,
                        from: options.from || "AFRICASTKNG",
                        text: options.message,
                        massages: data.Recipients || [],
                        activities: []
                    });

                    var status = record.messages.map(m => m.status.toUpperCase()).distinct();
                    record.status = status.length > 1? status.map(s => "PARTIAL_" + s).join('; ')
                        : status[0] || "pending_carrier_callback".toUpperCase();

                    if(data.Message){
                        record.activities.push({
                            status: record.status, 
                            message: data.Message
                        });
                    }

                    var regex = /([\d]+\.[\d]+)/;
                    if(data.Message && regex.test(data.Message))
                        record.totalCost = parseFloat(regex.exec(data.Message)[0] || "0");
                        
                    ls.save(record);

                    if (typeof next == "function")
                        next(null, record.totalCost);
                    
                    return record.totalCost;
                })
                .catch((error) => {
                    console.warn("Error sending SMS!", error, options);
                    if (typeof next == "function")
                        next(error);
                });
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