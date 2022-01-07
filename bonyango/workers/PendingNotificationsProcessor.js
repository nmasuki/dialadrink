var keystone = require('keystone');
var ClientNotification = keystone.list('ClientNotification');
var WorkProcessor = require('../helpers/WorkProcessor');

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
        .limit(500)
        .populate('client')
        .populate('broudcast')
        .exec((err, notifications) => {
            if (err)
                return next(err);

            //if (process.env.NODE_ENV == "development" && notifications.length)
            //    return next(null, [notifications[0]], done);

            return next(null, notifications, done);
        });
}

function doWork(err, notifications, next) {
    if (err)
        return console.warn(err);

    if (notifications && notifications.length) {
        notifications = notifications.filter(n => n.client);
        if(notifications.length)
            console.log(notifications.length + " client notifications to send..");

        var i = 0;
        return new Promise(function sending(resolve) {
            
            var n = notifications[i++];
            if(!n) return resolve();
            
            console.log(`sending ${n.type} to ${n.client.name}`, i + "/" + notifications.length);
            if (n.message.body)
                n.message.body = n.message.body.format(n.client);
            if (n.message.title)
                n.message.title = n.message.title.format(n.client);

            var promise;
            if (n.type == "sms")
                promise = n.client.sendSMSNotification(n.message.body, n);

            if (n.type == "email")
                promise = n.client.sendEmailNotification(n.message.title, n.message.body, n);

            if (n.type == "push")
                promise = n.client.sendNotification(n.message.title, n.message.body, n.message.icon, n);

            var markNotification = function(status){
                return function () {
                    n.status = status;
                    return n.save().then(() => {
                        console.log(`status ${status} while sending ${n.type} to ${n.client.name}`, i + "/" + notifications.length);
                        return Promise.timeout(100).then(() => sending(resolve));
                    })
                };
            };
    
            if(promise)                
                promise.then(markNotification('sent')).catch(markNotification('rejected'));
            else
                promise = markNotification('rejected');
            
            return promise;
        }).finally(function () {
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

module.exports = new WorkProcessor(getWork, doWork);