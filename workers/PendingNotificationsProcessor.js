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
        if(notifications.length)
            console.log(notifications.length + " client notifications to send..");
        
        return Promise.all(notifications.map(n => {
                var markNotification = function(status){
                    return function () {
                        n.status = status;
                        n.save();
                    };
                };

                if (n.message.body)
                    n.message.body = n.message.body.format(n.client);
                if (n.message.title)
                    n.message.title = n.message.title.format(n.client);

                if (n.type == "sms")
                    return n.client.sendSMSNotification(n.message.body, n)
                        .then(markNotification('sent'))
                        .catch(markNotification('rejected'));

                if (n.type == "email")
                    return n.client.sendEmailNotification(n.message.title, n.message.body, n)
                        .then(markNotification('sent'))
                        .catch(markNotification('rejected'));

                if (n.type == "push")
                    return n.client.sendNotification(n.message.title, n.message.body, n.message.icon, n)
                        .then(markNotification('sent'))
                        .catch(markNotification('rejected'));

                return Promise.resolve().then(markNotification('rejected'));
            }))
            .catch(console.warn)
            .finally(function () {
                var grouped = notifications.groupBy(n => n.broudcast && (n.broudcast._id || n.broudcast) || '');

                Object.values(grouped).forEach(g => {
                    if (!g.find(n => n.status != 'sent')) {
                        var b = g[0].broudcast;
                        if(b){
                            b.status = 'sent';
                            b.save();
                        }
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