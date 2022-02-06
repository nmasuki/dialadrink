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
    return function () {
        var context = this, args = arguments;
        return new Promise(function (resolve, reject) {
            this.my_resolve = resolve;
            promises.push(this);

            var throttler = function () {
                timeout = null;
                var ret;

                try {
                    ret = func.apply(context, args);
                } catch (e) {
                    console.warn("Error calling debounce on function!", e);
                }

                if (ret instanceof Promise)
                    ret.catch(console.error);

                promises.forEach(p => p.my_resolve(ret));
                if (promises.length > 1)
                    console.log(debounce ? "Debounced" : "Throttled ", func.name + " " + promises.length + " times");

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

                    if (value == undefined) value = "";
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

if (!String.prototype.removeAssents)
    String.prototype.removeAssents = function () {
        /*
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

            http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
        */
        var defaultDiacriticsRemovalMap = [
            { 'base': 'A', 'letters': '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F' },
            { 'base': 'AA', 'letters': '\uA732' },
            { 'base': 'AE', 'letters': '\u00C6\u01FC\u01E2' },
            { 'base': 'AO', 'letters': '\uA734' },
            { 'base': 'AU', 'letters': '\uA736' },
            { 'base': 'AV', 'letters': '\uA738\uA73A' },
            { 'base': 'AY', 'letters': '\uA73C' },
            { 'base': 'B', 'letters': '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181' },
            { 'base': 'C', 'letters': '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E' },
            { 'base': 'D', 'letters': '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0' },
            { 'base': 'DZ', 'letters': '\u01F1\u01C4' },
            { 'base': 'Dz', 'letters': '\u01F2\u01C5' },
            { 'base': 'E', 'letters': '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E' },
            { 'base': 'F', 'letters': '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B' },
            { 'base': 'G', 'letters': '\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E' },
            { 'base': 'H', 'letters': '\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D' },
            { 'base': 'I', 'letters': '\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197' },
            { 'base': 'J', 'letters': '\u004A\u24BF\uFF2A\u0134\u0248' },
            { 'base': 'K', 'letters': '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2' },
            { 'base': 'L', 'letters': '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780' },
            { 'base': 'LJ', 'letters': '\u01C7' },
            { 'base': 'Lj', 'letters': '\u01C8' },
            { 'base': 'M', 'letters': '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C' },
            { 'base': 'N', 'letters': '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4' },
            { 'base': 'NJ', 'letters': '\u01CA' },
            { 'base': 'Nj', 'letters': '\u01CB' },
            { 'base': 'O', 'letters': '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C' },
            { 'base': 'OI', 'letters': '\u01A2' },
            { 'base': 'OO', 'letters': '\uA74E' },
            { 'base': 'OU', 'letters': '\u0222' },
            { 'base': 'OE', 'letters': '\u008C\u0152' },
            { 'base': 'oe', 'letters': '\u009C\u0153' },
            { 'base': 'P', 'letters': '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754' },
            { 'base': 'Q', 'letters': '\u0051\u24C6\uFF31\uA756\uA758\u024A' },
            { 'base': 'R', 'letters': '\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782' },
            { 'base': 'S', 'letters': '\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784' },
            { 'base': 'T', 'letters': '\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786' },
            { 'base': 'TZ', 'letters': '\uA728' },
            { 'base': 'U', 'letters': '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244' },
            { 'base': 'V', 'letters': '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245' },
            { 'base': 'VY', 'letters': '\uA760' },
            { 'base': 'W', 'letters': '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72' },
            { 'base': 'X', 'letters': '\u0058\u24CD\uFF38\u1E8A\u1E8C' },
            { 'base': 'Y', 'letters': '\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE' },
            { 'base': 'Z', 'letters': '\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762' },
            { 'base': 'a', 'letters': '\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250' },
            { 'base': 'aa', 'letters': '\uA733' },
            { 'base': 'ae', 'letters': '\u00E6\u01FD\u01E3' },
            { 'base': 'ao', 'letters': '\uA735' },
            { 'base': 'au', 'letters': '\uA737' },
            { 'base': 'av', 'letters': '\uA739\uA73B' },
            { 'base': 'ay', 'letters': '\uA73D' },
            { 'base': 'b', 'letters': '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253' },
            { 'base': 'c', 'letters': '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184' },
            { 'base': 'd', 'letters': '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A' },
            { 'base': 'dz', 'letters': '\u01F3\u01C6' },
            { 'base': 'e', 'letters': '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD' },
            { 'base': 'f', 'letters': '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C' },
            { 'base': 'g', 'letters': '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F' },
            { 'base': 'h', 'letters': '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265' },
            { 'base': 'hv', 'letters': '\u0195' },
            { 'base': 'i', 'letters': '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131' },
            { 'base': 'j', 'letters': '\u006A\u24D9\uFF4A\u0135\u01F0\u0249' },
            { 'base': 'k', 'letters': '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3' },
            { 'base': 'l', 'letters': '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747' },
            { 'base': 'lj', 'letters': '\u01C9' },
            { 'base': 'm', 'letters': '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F' },
            { 'base': 'n', 'letters': '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5' },
            { 'base': 'nj', 'letters': '\u01CC' },
            { 'base': 'o', 'letters': '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275' },
            { 'base': 'oi', 'letters': '\u01A3' },
            { 'base': 'ou', 'letters': '\u0223' },
            { 'base': 'oo', 'letters': '\uA74F' },
            { 'base': 'p', 'letters': '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755' },
            { 'base': 'q', 'letters': '\u0071\u24E0\uFF51\u024B\uA757\uA759' },
            { 'base': 'r', 'letters': '\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783' },
            { 'base': 's', 'letters': '\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B' },
            { 'base': 't', 'letters': '\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787' },
            { 'base': 'tz', 'letters': '\uA729' },
            { 'base': 'u', 'letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289' },
            { 'base': 'v', 'letters': '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C' },
            { 'base': 'vy', 'letters': '\uA761' },
            { 'base': 'w', 'letters': '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73' },
            { 'base': 'x', 'letters': '\u0078\u24E7\uFF58\u1E8B\u1E8D' },
            { 'base': 'y', 'letters': '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF' },
            { 'base': 'z', 'letters': '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763' }
        ];

        var diacriticsMap = {};
        for (var i = 0; i < defaultDiacriticsRemovalMap.length; i++) {
            var letters = defaultDiacriticsRemovalMap[i].letters;
            for (var j = 0; j < letters.length; j++) {
                diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap[i].base;
            }
        }

        return this.replace(/[^\u0000-\u007E]/g, function (a) {
            return diacriticsMap[a] || a;
        });
    };

if (!String.prototype.cleanId)
    String.prototype.cleanId = function () {
        return this.removeAssents().toLowerCase().replace(/\W+/g, " ").trim().replace(/\W+/g, "-");
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
        var crypto = require('crypto');

        salt = (salt || process.env.SALT || crypto.randomBytes(16).toString('hex'));
        encryptedPassword = crypto.scryptSync(this.toString(), salt.toString(), 32).toString('hex');

        console.log("PASSWORD:", this.toString(), "SALT:", salt, "ENCRYPTED:", encryptedPassword)
        
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
        if (typeof selector != "function") selector = g => g[0];
        return Object.values(groups).map(selector);
    };

if (!Array.prototype.distinct)
    Array.prototype.distinct = function (prop) {
        return this.distinctBy(prop);
    };

if (!Array.prototype.orderBy)
    Array.prototype.orderBy = function (args) {
        var clauseArray = (Array.isArray(args) ? args : [args]);
        return this.slice(0).sort(function (a, b) {
            for (var i in clauseArray) {
                if (!clauseArray.hasOwnProperty(i)) continue;

                var clause = clauseArray[i];
                var x = typeof clause === "function" ? clause(a) : a;
                var y = typeof clause === "function" ? clause(b) : b;

                if (x < y) return -1;
                if (x > y) return 1;
            }

            return 0;
        });
    };

if (!Array.prototype.orderByDescending)
    Array.prototype.orderByDescending = function (args) {
        var clauseArray = (Array.isArray(args) ? args : [args]);
        return this.slice(0).sort(function (a, b) {
            for (var i in clauseArray) {
                if (!clauseArray.hasOwnProperty(i)) continue;

                var clause = clauseArray[i];
                var x = typeof clause === "function" ? clause(a) : a;
                var y = typeof clause === "function" ? clause(b) : b;

                if (x < y) return 1;
                if (x > y) return -1;
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

JSON.isValidString = function isJSONString(text) {
    if (typeof text == "string" && /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        return true;
    } else {
        return false;
    }
};

JSON.tryParse = function tryParse(str) {
    if (!str) return null;
    if (!JSON.isValidString(str)) return null;

    try {
        return JSON.parse(str);
    } catch (e) {
        console.error("Error parsing json.", str, e);
        return null;
    }
};

Date.tryParse = function tryParseDate(str) {
    try {
        return new Date(str);
    } catch (e) {
        return null;
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

Date.prototype.addMilliseconds = function (value) {
    return new Date(this.getTime() + value);
};

Date.prototype.since = function (date) {

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

    for (var i in values) {
        var limit = values[i] || Infinity;

        if (Math.abs(ms / values[i]) <= limit) {
            period = keys[i];
            val = ms / values[i];

            if (period == "hours") {
                var time = new Date().addHours(-val).toISOString(0, 10);
                var today = new Date().toISOString(0, 10);
                if (time < today)
                    return "Yesterday";
                else if (time > new Date(today).addDays(1).toISOString(0, 10))
                    return "Tomorrow";
            }

            if (period == "days") {
                if (parseInt(val) == 0)
                    return "Today";
                else if (parseInt(val) == 1)
                    return "Yesterday";
                else if (parseInt(val) == -1)
                    return "Tomorrow";
                else {
                    var index = parseInt(val);
                    if (Math.abs(index) < 5) {
                        var days = ["Sunday", "Monday", "Tuesaday", "Wednesday", "Thursday", "Friday", "Saturday"];
                        return (index < 0 ? "this " : "") + days[new Date().addDays(-index).getDay()];
                    }
                }
            }

            break;
        }
    }

    var rval = Math.round(Math.abs(val));
    if (rval == 1)
        period = period.replace(/(ie)?s$/, "");

    console.log(rval, val, period);

    return "{0} {1} {2} {3}".format(val < 0 ? "in" : "", rval, period, val < 0 ? "" : "ago").trim();
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

if (!Promise.timeout)
    Promise.timeout = function (timeout) {
        var args = Array.from(arguments).splice(1);
        return new Promise(resolve => setTimeout(() => resolve(args), timeout));
    };

Promise.prototype.always = Promise.prototype.finally;
Promise.prototype.done = Promise.prototype.then;
Promise.prototype.fail = Promise.prototype.catch;