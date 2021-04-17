/**
 * Created by nmasuki on 9/21/2017.
 */

if (!Object.values)
    Object.values = function (obj) {
        return Object.keys(obj).map(k => obj[k]);
    };

if (!Object.equals)
    Object.equals = function (x, y) {
        if (x === y) return true;
        // if both x and y are null or undefined and exactly the same

        if (!(x instanceof Object) || !(y instanceof Object)) return false;
        // if they are not strictly equal, they both need to be Objects

        if (x.constructor !== y.constructor) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.

        for (var p in x) {
            if (!x.hasOwnProperty(p)) continue;
            // other properties were tested using x.constructor === y.constructor

            if (!y.hasOwnProperty(p)) return false;
            // allows to compare x[ p ] and y[ p ] when set to undefined

            if (x[p] === y[p]) continue;
            // if they have the same strict value or identity then they are equal

            if (typeof (x[p]) !== "object") return false;
            // Numbers, Strings, Functions, Booleans must be strictly equal

            if (!Object.equals(x[p], y[p])) return false;
            // Objects and Arrays must be tested recursively
        }

        for (p in y) {
            if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
            // allows x[ p ] to be set to undefined
        }
        return true;
    };

if (!Object.isEmpty)
    Object.isEmpty = function (obj) {
        //check if it's an Obj first
        var isObj = obj !== null &&
            typeof obj === 'object' &&
            Object.prototype.toString.call(obj) === '[object Object]';

        if (isObj) {
            for (var o in obj)
                if (obj.hasOwnProperty(o))
                    return false;

            return true;
        } else {
            console.warn("isEmpty function only accept an Object");
        }
    };

if (!Object.diff)
    Object.diff = function (obj1, obj2) {
        if (obj2 && !obj1)
            return Object.diff({}, obj2);
        if (obj1 && !obj2)
            return Object.diff(obj1, {});

        var ret = {},
            rett;
        for (var i in obj2) {
            if (obj2.hasOwnProperty(i)) {
                rett = {};
                if (typeof obj2[i] === 'object') {
                    rett = Object.diff(obj1[i], obj2[i]);
                    if (!Object.isEmpty(rett))
                        ret[i] = rett;
                } else {
                    if (!obj1 || !obj1.hasOwnProperty(i) || obj2[i] !== obj1[i])
                        ret[i] = [obj1[i], obj2[i]];
                }
            }
        }
        return ret;
    };

if (!Function.prototype.stackTrace)
    Function.prototype.stackTrace = function () {
        var callstack = [];
        var isCallstackPopulated = false;
        try {
            a.dont.exist += 0; //doesn't exist- that's the point
        } catch (e) {
            if (e.stack) { //Firefox
                var lines = e.stack.split('\n');
                for (var i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*(at)\s/)) {
                        callstack.push(lines[i]);
                    }
                }
                //Remove call to stackTrace()
                callstack.shift();
                isCallstackPopulated = true;
            } else if (window.opera && e.message) { //Opera
                var lines = e.message.split('\n');
                for (var i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*(at)\s/)) {
                        var entry = lines[i];
                        //Append next line also since it has the file info
                        if (lines[i + 1]) {
                            entry += ' at ' + lines[i + 1];
                            i++;
                        }
                        callstack.push(entry);
                    }
                }
                //Remove call to stackTrace()
                callstack.shift();
                isCallstackPopulated = true;
            }
        }

        if (!isCallstackPopulated) { //IE and Safari
            var currentFunction = arguments.callee.caller;
            while (currentFunction) {
                var fn = currentFunction.toString();
                var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
                callstack.push(fname);
                currentFunction = currentFunction.caller;
            }
        }
        return callstack;
    };

//
if (!Function.prototype.retryApply)
    Function.prototype.retryApply = function (context, checkReady, maxRetries, retryTime, args) {
        var retry = 0,
            fn = this,
            stackTrace = arguments.callee.caller.stackTrace();

        maxRetries = maxRetries || 5;
        retryTime = retryTime || 1000;

        return new Promise(function (fulfill, reject) {
            var timeInterval = setInterval(function () {
                if (retry++ > maxRetries) {
                    clearInterval(timeInterval);
                    var fnName = fn.name ? fn.name + "." : "";
                    reject(`[Function ${fnName}retryApply]: Max retries reached!\r\n` + stackTrace.join("\r\n"))
                    return;
                } else if (retry > 1) {
                    //console.debug(`Retrying!! Attempt ${retry - 1} of ${maxRetries}.`)
                }

                var isReady = typeof checkReady == "function" ? !!checkReady() : true;
                if (isReady) {
                    try {
                        var d = fn.apply(context, args);
                        if (d instanceof Promise)
                            d.then(fulfill).catch(reject);
                        else
                            fulfill(d);

                        clearInterval(timeInterval);
                    } catch (e) { //Retry
                        console.warn(e);
                    }
                }
            }, retryTime);
        }).catch(console.log);
    };

//
if (!Function.prototype.retryCall)
    Function.prototype.retryCall = function (context, checkReady, maxRetries, retryTime) {
        var args = [];
        for (var i = 4; i < arguments.length; i++)
            args.push(arguments[i]);

        return this.retryApply(context, checkReady, maxRetries, retryTime, args);
    };

//
if (!Function.prototype.promiseApply)
    Function.prototype.promiseApply = function (context) {
        var retry = 0,
            fn = this,
            maxRetries = 5,
            retryTime = 100;

        var args = [];
        for (var i = 1; i < arguments.length; i++)
            args.push(arguments[i]);

        return new Promise(function (fulfill, reject) {
            var timeInterval = setInterval(function () {
                try {
                    var d = fn.apply(context, args);
                    clearInterval(timeInterval);
                    fulfill(d);
                    return;
                } catch (e) {
                    //Retry
                    console.log(e);
                }

                if (++retry > maxRetries) {
                    clearInterval(timeInterval);
                    reject("Max retries reached!")
                }
            }, retryTime);
        }).catch(console.debug);
    };

//
if (!Function.prototype.promiseCall)
    Function.prototype.promiseCall = function (context) {
        var args = [];
        for (var i = 1; i < arguments.length; i++)
            args.push(arguments[i]);

        return this.promiseApply.apply(this, context, args);
    };

// Internal function used to implement `_.throttle` and `_.debounce`.
var limit = function (func, wait, debounce) {
    var timeout, promises = [];
    return function(){
        var context = this, args = arguments;
        return new Promise(function (resolve, reject) {
            this.my_resolve = resolve;
            promises.push(this);

            var throttler = function () {
                timeout = null;
                var ret = func.apply(context, args);
                if(ret instanceof Promise)
                    ret.catch(console.error);

                promises.forEach(p => p.my_resolve(ret));
                if(promises.length > 1)
                    console.log(debounce? "Debounced": "Throttled", func.name, promises.length, "times");

                promises.length = 0;
            };

            if (debounce && timeout)
                clearTimeout(timeout);

            if (debounce || !timeout)
                timeout = setTimeout(throttler, wait || 1500);
        });
    };
};

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time.
if (!Function.prototype.throttle)
    Function.prototype.throttle = function (wait) {
        return limit(this, wait, false);
    };

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds.
if (!Function.prototype.debounce)
    Function.prototype.debounce = function (wait) {
        return limit(this, wait, true);
    };

if (!Number.prototype.format)
    Number.prototype.format = Number.prototype.formatNumber = function (n, x) {
        var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
        return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
    };

//String formating
if (!String.prototype.format)
    String.prototype.format = function () {
        var formated = this.toString();

        var matches = (formated.match(/\{([^}]+)\}/gm) || []).map(m => m.trim('{}'));
        if (matches && matches.length) {
            for (var i in matches) {
                if (!matches.hasOwnProperty(i))
                    continue;

                var key = matches[i];
                try {
                    var regex = new RegExp("(\\{" + key.escapeRegExp() + "\\})", "g");
                    var obj = Array.from(arguments).find(function (o) {
                        return typeof o != "string" && o && o[key];
                    }) || {};
                    var value = obj[key] || arguments[key];
                    
                    if(value == undefined) value = "";
                    try {
                        if (ko && ko.unwrap)
                            value = ko.unwrap(value);
                    } catch (e) {
                        //ignore
                    }

                    formated = formated.replace(regex, value);
                } catch (ex) {
                    console.log(ex);
                }
            }
        }

        return formated;
    };

if (!String.prototype.splitArgs)
    String.prototype.splitArgs = function () {
        //The parenthesis in the regex creates a captured group within the quotes
        var myRegexp = /[^\s"]+|"([^"]*)"/gi;
        var myString = this.toString();
        var myArray = [];

        do {
            //Each call to exec returns the next regex match as an array
            var match = myRegexp.exec(myString);
            if (match != null) {
                //Index 1 in the array is the captured group if it exists
                //Index 0 is the matched text, which we use if no captured group exists
                myArray.push(match[1] ? match[1] : match[0]);
            }
        } while (match != null);
        return myArray;
    }

//https://www.sitepoint.com/trimming-strings-in-javascript/
//if (!String.prototype.trimLeft)
String.prototype.trimLeft = function (charlist) {
    if (charlist === undefined)
        charlist = "\\s";

    return this.replace(new RegExp("^[" + charlist + "]+"), "");
};

//https://www.sitepoint.com/trimming-strings-in-javascript/
//if (!String.prototype.trimRight)
String.prototype.trimRight = function (charlist) {
    if (charlist === undefined)
        charlist = "\\s";

    return this.replace(new RegExp("[" + charlist + "]+$"), "");
};

//https://www.sitepoint.com/trimming-strings-in-javascript/
//if (!String.prototype.trim)
String.prototype.trim = function (charlist) {
    return this.trimRight(charlist).trimLeft(charlist);
};

//
if (!String.prototype.contains)
    String.prototype.contains = String.prototype.any = function (search) {
        if (typeof search == "function")
            return this.map(search).any(true);
        else if (search)
            return this.indexOf(search) >= 0;
        else
            return this.length > 0;
    };

if (!String.prototype.camelCaseToSentence)
    String.prototype.camelCaseToSentence = function () {
        return this.trim().replace(/^[a-z]|[A-Z]/g, function (v, i) {
            return i === 0 ? v.toUpperCase() : " " + v.toLowerCase();
        });
    };

if (!String.prototype.toSentenceCase)
    String.prototype.toSentenceCase = function () {
        var sentence = (this || "").trim();
        return sentence.substr(0, 1).toUpperCase() + sentence.substr(1).toLowerCase();
    };

if (!String.prototype.toProperCase)
    String.prototype.toProperCase = function (lowerCaseTheRest) {
        return ((lowerCaseTheRest ? this.toLowerCase() : this) || "")
            .replace(/(^|[\s\xA0])[^\s\xA0]/g, function (s) {
                return s.toUpperCase();
            });
    };

if (!String.prototype.escapeRegExp)
    String.prototype.escapeRegExp = function escapeRegExp() {
        return (this || "")
            .replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&")
            .replace(/\*/g, ".*?");
    };

if (!String.prototype.cleanId)
    String.prototype.cleanId = function () {
        return this.toLowerCase().replace(/\W+/g, " ").trim().replace(/\W+/g, "-").substr(0, 64);
    };

if (!String.prototype.sanitizePhoneNumber)
    String.prototype.cleanPhoneNumber = String.prototype.sanitizePhoneNumber = function sanitizePhoneNumber(countryCode) {
        var phone = (this || "").replace(/[\W]+/g, "");
        countryCode = countryCode || String.countryCode || "254";

        if (!phone)
            return "";

        if (phone.startsWith("+"))
            phone = phone.replace("^+", "");

        if (phone.length < 11)
            phone = phone.trim().replace(/^0/, countryCode);

        if (/^7/.test(phone))
            phone = phone.trim().replace(/^7/, countryCode + "7");

        return phone;
    };

if (!String.prototype.truncate)
    String.prototype.truncate = function (length, ending) {
        length = length || 100;
        ending = ending || '...';
        var str = (this || ""),
            index = length - ending.length;

        while (index > 0 && str[index] && /\w/.test(str[index]))
            index--;

        if (this.length > length) {
            return (str.substring(0, index).trim().trim('.') + ending).trim();
        } else {
            return (str || "").trim();
        }
    };

if (!String.prototype.encryptPassword)
    String.prototype.encryptPassword = function (salt) {
        var bcrypt = require('bcrypt');

        salt = (salt || process.env.SALT || bcrypt.genSaltSync());
        encryptedPassword = bcrypt.hashSync(this.toString(), salt.toString());
        return {
            salt,
            encryptedPassword
        };
    };

if (!String.prototype.comparePassword)
    String.prototype.comparePassword = function (encryptedPassword, salt) {
        var encrypted2 = this.encryptPassword(salt);
        return encryptedPassword == encrypted2.encryptedPassword;
    };

if (!Array.prototype.clone)
    Array.prototype.clone = function () {
        return this.slice(0);
    };

if (!Array.prototype.nth)
    Array.prototype.nth = function (filter, index) {
        index = (index || 1) - 1;
        filter = filter || (f => true);
        return this.filter(filter)[index];
    };

//
if (!Array.prototype.first)
    Array.prototype.first = function (filter) {
        filter = filter || (f => true);
        var filtered = this.filter(filter);
        return filtered ? filtered[0] : null;
    };

//
if (!Array.prototype.last)
    Array.prototype.last = function (filter) {
        filter = filter || (f => true);
        var arr = this.filter(filter);
        return arr[arr.length - 1];
    };

//
if (!Array.prototype.any)
    Array.prototype.contains = Array.prototype.any = function (search) {
        if (typeof search == "function")
            return this.map(search).any(true);
        else if (search)
            return this.indexOf(search) >= 0;
        else
            return this.length > 0;
    };

//
if (!Array.prototype.aggregate)
    Array.prototype.aggregate = function (initial, aggregator, selector) {
        if (selector && typeof selector != "function") throw "selector must be a function..";
        var values = selector ? this.map(selector) : this;
        return values.reduce(aggregator, initial);
    };

//
if (!Array.prototype.sum)
    Array.prototype.sum = function (selector) {
        return this.aggregate(0.0, (a, b) => a + (parseFloat(b) || 0), selector);
    };

//
if (!Array.prototype.selectMany)
    Array.prototype.selectMany = function (selector) {
        return this.aggregate([], (a, b) => a.concat(b), selector || (a => a));
    };

//
if (!Array.prototype.avg)
    Array.prototype.avg = function (selector) {
        return this.sum(selector) / this.length;
    };

if (!Array.prototype.prod)
    Array.prototype.prod = function (selector) {
        return this.aggregate(1.0, (a, b) => a * (parseFloat(b) || 1), selector);
    };


if (!Array.prototype.splitChunks)
    Array.prototype.splitChunks = function (option) {
        var arr = this;
        var chunkSize, chunkCount = 10;

        if (typeof option == "number") {
            chunkSize = option;
            chunkCount = parseInt(arr.length / chunkSize);
        } else {
            option = option || {
                chunkCount: 10
            };
            if (option.chunkSize) {
                chunkSize = option.chunkSize;
                chunkCount = parseInt(arr.length / chunkSize);
            } else if (option.chunkCount) {
                chunkCount = option.chunkCount || 10;
            }
        }

        var groups = this.groupBy((a, i) => i % chunkCount);
        return Object.values(groups || {});
    };
//
if (!Array.prototype.group)
    Array.prototype.group = function (compare) {
        var groups = this.groupBy();
        return Object.keys(groups).map(k => groups[k]);
    };

//
if (!Array.prototype.groupBy)
    Array.prototype.groupBy = function (compare) {
        var i = 0;
        return this.reduce(function (groups, x) {
            var groupKey = (typeof compare == "function" ? compare(x, i) : (x && x[compare] || x || 0));
            (groups[groupKey] = groups[groupKey] || []).push(x);
            i++;
            return groups;
        }, {});
    };


if (!Array.prototype.distinctBy)
    Array.prototype.distinctBy = function (clause, selector) {
        var groups = this.groupBy(clause);
        if(typeof selector != "function") selector = g => g[0];
        return Object.values(groups).map(selector);
    };

if (!Array.prototype.distinct)
    Array.prototype.distinct = function (prop) {
        return this.distinctBy(prop);
    };

if (!Array.prototype.orderBy)
    Array.prototype.orderBy = function (args) {
        var clauseArray = (Array.isArray(args)? args: [args]); 
        return this.slice(0).sort(function (a, b) {
            for(var i in clauseArray){
                if(!clauseArray.hasOwnProperty(i)) continue;

                var clause = clauseArray[i];
                var x = typeof clause === "function" ? clause(a) : a;
                var y = typeof clause === "function" ? clause(b) : b;
            
                if(x < y) return -1;
                if(x > y) return 1;
            }
            
            return 0;
        });
    };

if (!Array.prototype.orderByDescending)
    Array.prototype.orderByDescending = function (args) {
        var clauseArray = (Array.isArray(args)? args: [args]); 
        return this.slice(0).sort(function (a, b) {
            for(var i in clauseArray){
                if(!clauseArray.hasOwnProperty(i)) continue;

                var clause = clauseArray[i];
                var x = typeof clause === "function" ? clause(a) : a;
                var y = typeof clause === "function" ? clause(b) : b;
            
                if(x < y) return 1;
                if(x > y) return -1;
            }
            
            return 0;
        });
    };


if (!Array.prototype.count)
    Array.prototype.count = function (clause) {
        return this.filter(function (a) {
            return !!(typeof clause === "function" ? clause(a) : a);
        }).length;
    };

if (!Array.prototype.max)
    Array.prototype.max = function (clause) {
        var ordered = this.orderByDescending(clause);
        return clause(ordered.first());
    };

if (!Array.prototype.min)
    Array.prototype.min = function (clause) {
        var ordered = this.orderBy(clause);
        return clause(ordered.first());
    };

if (!Array.prototype.flatten)
    Array.prototype.flatten = function (map) {
        return this.reduce(function (a, b) {
            return a.concat(typeof map === "function" ? map(b) : b);
        }, []);
    };

//
if (!Math.sequence)
    Math.sequence = function (min, max, fxn) {
        var N = [];

        for (var i = (min || 0); i <= (max || 100); i++)
            N.push(typeof fxn == "function" ? fxn(i) : i);

        return N;
    };

JSON.isValidString = function isJSONString(text){
    if (typeof text == "string" && /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        return true;
    } else {
        return false;
    }
};

JSON.tryParse = function tryParse(str){
    if(!str) return null;
    if(!JSON.isValidString(str)) return null;

    try{
        return JSON.parse(str);
    }catch(e){
        console.error("Error parsing json.", str, e);
        return null;
    }
};

Date.tryParse = function tryParseDate(str){
    try {
        return new Date(str);
    }catch(e){
        return undefined;
    }
};

Date.isLeapYear = function (year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};

Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

Date.prototype.isLeapYear = function () {
    return Date.isLeapYear(this.getFullYear());
};

Date.prototype.getDaysInMonth = function () {
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};

Date.prototype.addYears = function (value) {
    var years = Math.floor(value);
    var months = (value - years) * 12;
    this.setYear(this.getYear() + years);

    if (months)
        this.addMonths(months);

    return this;
};

Date.prototype.addMonths = function (value) {
    var months = value % 12;
    var years = Math.floor(value / 12);
    var date = new Date(this.toISOString());

    date.setDate(1);
    date.setMonth(this.getMonth() + months);
    date.setDate(Math.min(date.getDate(), date.getDaysInMonth()));

    if (years)
        date.addYears(years);

    return date;
};

Date.prototype.addDays = function (value) {
    return this.addHours(24 * value);
};

Date.prototype.addHours = function (value) {
    return this.addMinutes(value * 60);
};

Date.prototype.addMinutes = function (value) {
    return this.addSeconds(value * 60);
};

Date.prototype.addSeconds = function (value) {
    return this.addMilliseconds(value * 1000);
};

Date.prototype.addMilliseconds = function(value){
    return new Date(this.getTime() + value);
};

Date.prototype.since = function(date){

    var ms = date ? this.getTime() - new Date(date).getTime()
        : new Date().getTime() - this.getTime();
    
    var mapping = {
        ms: 1,
        secs: 1000,
        mins: 1000 * 60,
        hours: 1000 * 60 * 60,
        days: 1000 * 60 * 60 * 24,
        weeks: 1000 * 60 * 60 * 24 * 7,         
        months: 1000 * 60 * 60 * 24 * 28,         
        years: 1000 * 60 * 60 * 24 * 365.25,
    };

    var values = Object.values(mapping), 
        keys = Object.keys(mapping),
        period = "ms",
        val = ms;

    for(var i in values){
        var limit = values[i] || Infinity;

        if(Math.abs(ms / values[i]) <= limit){
            period = keys[i];
            val = ms / values[i];

            if(period == "hours"){
                var time = new Date().addHours(-val).toISOString(0, 10);
                var today = new Date().toISOString(0, 10);
                if(time < today)
                    return "Yesterday";
                else if(time > new Date(today).addDays(1).toISOString(0, 10))
                    return "Tomorrow";
            }

            if(period == "days"){
                if(parseInt(val) == 0)
                    return "Today";
                else if(parseInt(val) == 1)
                    return "Yesterday";
                else if(parseInt(val) == -1)
                    return "Tomorrow";
                else{
                    var index = parseInt(val);
                    if(Math.abs(index) < 5){
                        var days = ["Sunday", "Monday", "Tuesaday", "Wednesday", "Thursday", "Friday", "Saturday"];
                        return (index < 0? "this ": "") + days[new Date().addDays(-index).getDay()];
                    }
                }
            }

            break;
        }
    }

    var rval = Math.round(Math.abs(val));
    if(rval == 1)
        period = period.replace(/(ie)?s$/, "");

    console.log(rval, val, period);

    return "{0} {1} {2} {3}".format(val < 0? "in": "", rval, period, val < 0? "": "ago").trim();
};

Number.prototype.pad = function pad(width, z) {
    var n = this + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z || '0') + n;
};

// Add `finally()` to `Promise.prototype`
if (!Promise.prototype.finally)
    Promise.prototype.finally = function (onFinally) {
        return this.then(
            /* onFulfilled */
            res => Promise.resolve(onFinally()).then(() => res),
            /* onRejected */
            err => Promise.resolve(onFinally()).then(() => console.warn(err))
        );
    };

if (!Promise.any)
    Promise.any = function (promises) {
        return new Promise(function (resolve, reject) {
            var count = promises.length, resolved = false;
            promises.forEach(function (p) {
                Promise.resolve(p).then(function (value) {
                    count--;
                    resolved = true;
                    resolve(value);
                }, function () {
                    if (--count === 0 && !resolved)
                        reject("No promises resolved successfully.");
                });
            });
        });
    };

Promise.prototype.always = Promise.prototype.finally;
Promise.prototype.done = Promise.prototype.then;
Promise.prototype.fail = Promise.prototype.catch;