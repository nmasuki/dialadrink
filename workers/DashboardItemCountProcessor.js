var keystone = require('keystone');
var ClientNotification = keystone.list('ClientNotification');
var WorkProcessor = require('../helpers/WorkProcessor');
var ls = require('../helpers/LocalStorage').getInstance("dashmenuitem");

var self = module.exports = new WorkProcessor(getWork, doWork);

function getWork(next, done) {
    var items = ls.getAll().filter(i => i.modifiedDate < new Date().addMinutes(-5));
    next(null, items, done);
}

function doWork(err, items, next) {
    if (err) {
        next(err);
        return console.warn(err);
    }

    if (items && items.length) {
        console.log(items.length + " items to update..");

        Promise.all(items.map(item => {
                var href = item.href.replace(/^\/|\/$|(ie)?s/, "").trim();
                switch (href) {
                    case "order":
                        return getOrderCount();
                    case "purchase":
                        break;
                }
            })).catch(console.warn)
            .finally(function () {
                if (typeof next == "function")
                    next();
            });
    } else {
        if (typeof next == "function")
            next();

        return Promise.resolve();
    }
}
