var najax = require('najax');
var fs = require('fs');
var lockFile = require('lockfile');

var lookUpLogFile = "../lookups.json";
var lookUps = fs.existsSync(lookUpLogFile) ? JSON.parse(fs.readFileSync(lookUpLogFile) || "{}") : {};
var updateLookUp = (function (number, res) {
    lockFile.lock(lookUpLogFile + ".lock", function (err) {
        if (err)
            return console.error("Could not aquire lock.", lookUpLogFile + ".lock", err);
        
        try {
            lookUps = fs.existsSync(lookUpLogFile) ? JSON.parse(fs.readFileSync(lookUpLogFile) || "{}") : {};
            lookUps[number] = res;
            fs.writeFile(lookUpLogFile, JSON.stringify(lookUps));
        } catch (e) {
            console.error(e);
        }

        lockFile.unlock(lookUpLogFile + ".lock");
    });
}).debounce(1000);

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
                error: function (xhr, status, error) {
                    reject(error);
                    if (typeof next == "function")
                        next(error);
                }
            });
        });
    };

    function pickOneApiKey(){
        var allKeys = ['159eece6bd4f7fdc23916fd7778efa8c', '0c2315a3ad790d8d3b6b3a53ec8a4c75', '1845a28d63e1b10f9e73aa474d33d8fb', ];
        var firstOfTheMonth = (new Date()).toISOString().substr(0, 8) + "01";
        
        var monthLookUps = Object.values(lookUps).filter(l => l.created_at >= firstOfTheMonth);
        var keyIndex = new Date().getMonth() % 2 == 0 ? Math.ceil(monthLookUps.length / 90) : monthLookUps.length;

        return allKeys[keyIndex % allKeys.length];
    }
   
    self.validateNumber = function (number) {
        return new Promise((resolve, reject) => {
            if (lookUps[number] && !lookUps[number].error)
                return resolve(lookUps[number]);            
            
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
                    try{
                        if(typeof res == "string")
                            res = JSON.parse(res);
                        res.created_at = new Date();
                        res.key = lookUpKey;
                    }catch(e){
                        console.error("Error while validating", number, e);
                    }

                    updateLookUp(number, res);
                    if(res.error){
                        console.error("Error while validating", res.error.info);
                        resolve({ valid: true });
                    } else {
                        if (!res.valid)
                            console.log("Invalid number", number);
                        resolve(res);
                    }
                },
                error: function (xhr, status, err) {
                    console.warn.apply(this, arguments);
                    resolve({valid: true});
                }
            });
        });
    };

    self.sendSMS = function compose(to, message, next) {
        var url = apiUrl.format('compose') + `&sender=${sender}`;

        return self.balance().then(function (balance) {
            console.log("SMS Balance:", balance);
            var err = "";
            
            if (balance < 0)
                return console.error("MoveSMS balance is low. Please topup.");

            if (process.env.NODE_ENV != "production") {
                err = "Ignoring SMS notification for non-prod environment!";
                if (typeof next == "function")
                    next(err);
                return Promise.reject(err);
            }

            var numbers = (Array.isArray(to) ? to : [to]).map(t => t.cleanPhoneNumber());
            return Promise.all(numbers.map(n => self.validateNumber(n))).then(values => {
                var invalid = numbers.filter((n, i) => !values[i].valid);
                
                if (numbers.length == invalid.length) {
                    err = "Ignoring SMS notification for invalid numbers! " + invalid.join();
                    if (typeof next == "function")
                        next(err);
                    return Promise.reject(err);
                }

                if (invalid.length) 
                    console.warn(err = "Some invalid numbers found '" + invalid.join() + "' not sending sms to them!");

                return new Promise((resolve, reject) => {
                    najax.post({
                        url: url,
                        data: {
                            to: numbers.filter((n, i) => values[i]).join(','),
                            message: message,
                            msgtype: 5,
                            dlr: 0
                        },
                        success: function (response) {
                            resolve(balance - 2);
                            if (typeof next == "function")
                                next(null, balance);
                        },
                        error: function (xhr, status, error) {
                            reject(error);
                            if (typeof next == "function")
                                next(error);
                        }
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