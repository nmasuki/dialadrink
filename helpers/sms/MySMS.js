var najax = require('najax');
var wss = require('../WebSocketServer');
var LocalStorage = require('../LocalStorage');
var ls = new LocalStorage("lookups");

function pickOneApiKey() {
    var allKeys = ['159eece6bd4f7fdc23916fd7778efa8c', '0c2315a3ad790d8d3b6b3a53ec8a4c75', '1845a28d63e1b10f9e73aa474d33d8fb', ];
    var firstOfTheMonth = (new Date()).toISOString().substr(0, 8) + "01";

    var monthLookUps = ls.getAll().filter(l => l.created_at >= firstOfTheMonth);
    var keyIndex = new Date().getMonth() % 2 == 0 ? Math.ceil(monthLookUps.length / 10) : monthLookUps.length;

    return allKeys[keyIndex % allKeys.length];
}

function BaseSMS() {
    var self = this;

    self.balance = function(){ return Promise.resolve(10); };

    self.sendSMS = function(to, message, next){
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

            return wss.sendSMS(validNos, message).then(a => {
                if (typeof next == "function")
                    next(null, a);
            }).catch(err => {
                if (typeof next == "function")
                    next(err);
            });
        });
    };

    self.validateNumber = function (number) {
        return new Promise((resolve, reject) => {
            var numberLookup = ls.get(number);

            if (numberLookup && !numberLookup.error && numberLookup.created_at && new Date(numberLookup.created_at) > new Date().addDays(-120))
                return resolve(numberLookup);

            var lookUpKey = pickOneApiKey();
            console.log("Number lookup: ", number, lookUpKey);

            najax.get({
                url: `http://apilayer.net/api/validate`,
                dataType: "application/json; charset=utf-8",
                data: {
                    access_key: lookUpKey,
                    country_code: '',
                    number: number,
                    format: 1,
                },
                success: function (res) {
                    try {
                        if (typeof res == "string")
                            res = JSON.parse(res);

                        res.id = number;
                        res.created_at = new Date();
                        res.key = lookUpKey;
                    } catch (e) {
                        console.error("Error while validating", number, e);
                    }
                    
                    ls.save(res);
                    if (res.error) {
                        console.error("Error while validating", res.error.info);
                        resolve({ valid: true });
                    } else {
                        if (!res.valid)
                            console.log("Invalid number:", number);
                        resolve(res);
                    }
                },
                error: function (xhr, status, err) {
                    console.warn.apply(this, arguments);
                    resolve({ valid: true });
                }
            });
        });
    };

    return self;
}

module.exports = BaseSMS;