var keystone = require('keystone');
var ClientNotification = keystone.list('ClientNotification');

var WorkProcessor = require('../helpers/WorkProcessor');

var self = module.exports = new WorkProcessor(getWork, doWork);

function getWork(next, done) {
    var filter = {
        $and: [{
            status: 'pending'
        }, {
            $or: [{
                scheduleDate: null
            }, {
                scheduleDate: {
                    $lte: new Date()
                }
            }]
        }]
    };

    var sort = {
        scheduleDate: 1,
        createdDate: 1
    };

    ClientNotification.model
        .find(filter).sort(sort)
        .populate('client')
        .populate('broudcast')
        .exec((err, notifications) => {
            if (err)
                return next(err);

            if (keystone.get("env") == "development" && notifications.length)
                next(null, [notifications[0]], done);
            else
                next(null, notifications, done);
        });
}

function doWork(err, notifications, next) {
    if (err)
        return console.warn(err);

    if (notifications && notifications.length) {
        notifications = notifications.filter(n => n.client);
        console.log(notifications.length + " client notifications to send..");
        return Promise.all(notifications.map(n => {
                var markAsSent = function () {
                    n.status = "sent";
                    n.save();
                };

                var markAsRejected = function (error) {
                    n.status = "rejected";
                    n.save();
                };

                if (n.type == "sms")
                    return n.client.sendSMSNotification(n.message.body, n)
                        .then(markAsSent).catch(markAsRejected);
                if (n.type == "email")
                    return n.client.sendEmailNotification(n.message.title, n.message.body, n)
                        .then(markAsSent).catch(markAsRejected);
                if (n.type == "push")
                    return n.client.sendNotification(n.message.title, n.message.body, n.message.icon, n)
                        .then(markAsSent).catch(markAsRejected);

                return Promise.resolve().then(markAsRejected);
            }))
            .then(function () {
                var grouped = notifications.groupBy(n => n.broudcast._id);

                Object.values(grouped).forEach(g => {
                    if (g.all(n => n.status == 'sent')) {
                        var b = g[0].broudcast;
                        b.status = 'sent';
                        b.save();
                    }
                });

                if (typeof next == "function")
                    next();
            });

    } else {
        if (typeof next == "function")
            next();

        return Promise.resolve();
    }
}