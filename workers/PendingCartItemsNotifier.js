var keystone = require('keystone');
var WorkProcessor = require('../helpers/WorkProcessor');
var ClientNotification = keystone.list('ClientNotification');

var self = module.exports = new WorkProcessor(getWork, doWork);

function getWork(next) {
    const db = keystone.mongoose.connection;
    var opt = keystone.get("session options");

    var filter = {
        $and: [{
            session: /(userData)/
        }, {
            session: /(cart"\:\{[^\}]+\})/
        }]
    };

    /*
    if(process.env.NODE_ENV == "development"){
        filter.$and.push({session: /(254720805835)/});
    }*/

    db.collection('app_sessions')
        .find(filter)
        .sort({ expires: -1 })
        //.limit(1000)
        .toArray((err, sessions) => {
            if (sessions && sessions.length) {
                console.log(`Found ${sessions.length} sessions with pending cart items..`);

                sessions = sessions.map(s => {
                    var sess = JSON.parse(s.session || "{}");

                    sess._id = s._id;
                    sess.expires = s.expires;

                    if (opt && opt.cookie)
                        sess.startDate = s.expires.addSeconds(-opt.cookie.maxAge / 1000);

                    return sess;
                });

                if(sessions.length){
                    var maxSeq = sessions.max(s => s.expires);
                    if(maxSeq)
                        maxSeq = new Date(maxSeq).addMilliseconds(10).toISOString();

                    if (self.worker.sequence)
                        console.log("Seq:", self.worker.sequence);
                    if ((self.worker.sequence || "").toString() !== maxSeq)
                        console.log("Seq:", maxSeq);

                    self.worker.sequence = maxSeq;
                    self.worker.save();
                }

                var startDate = new Date().addDays(-120);
                var endDate = new Date().addDays(-5);

                sessions = sessions.filter(s => {
                    var cartItems = Object.values(s.cart);
                    return cartItems.some(c => {
                        var efDate = new Date(c.modifiedDate || c.date);
                        return efDate > startDate && efDate <= endDate;
                    });
                });
                
                console.log(`${sessions.length} within notification period..`);

                sessions = sessions.filter(s => s.webpush || s.fcm);
                console.log(`${sessions.length} sessions have push token..`);
            }

            next(err, sessions);
        });
}

function doWork(err, sessions, next) {
    if(err || ! sessions)
        return console.error("Error while creating cart item notification!", err);

    var title = `Your shopping cart at '${keystone.get("name")}'`;
    var body = "Hi {firstName}. You have some items waiting in your cart.";

    sessions.forEach(s => {
        keystone.list("Client").model.find({
            sessions: { $elemMatch: { $eq: s._id } }
        }).exec((err, clients) => {
            if (err)
                return console.error(err);

            if (clients)
                clients.forEach(c => {
                    ClientNotification.model.find({
                        type: "push",
                        status: 'pending',
                        client: c._id
                    }).exec((err, pending) => {
                        if (err)
                            return console.error(err);

                        if(pending && pending.length)
                            return console.log(`Skipping notification to '${c.name}'. User has ${pending.length} pending notifications.`);

                        var date = new Date().toISOString();
                        var scheduleDate = new Date(date.substr(0, 10));
                        var scheduleTime = date.substr(11).split(":");

                        if (scheduleTime[0] > 22 - 3) {
                            scheduleTime[0] = 18 - 3;
                            scheduleDate = scheduleDate.addDays(1);
                        } else if (scheduleTime[0] <= 11 - 3){
                            scheduleTime[0] = 18 - 3;
                            scheduleTime[1] = 45;
                        }


                        var n = new ClientNotification.model({
                            client: c,
                            scheduleDate: new Date(scheduleDate.toISOString().substr(0, 10) + "T" + scheduleTime.join(":")),
                            type: "push",
                            status: 'pending',
                            message: {
                                title: title.format(c),
                                body: body.format(c),
                                data: {
                                    sessionId: s._id,
                                    buttons: ["Continue Shopping"]
                                }
                            }
                        });

                        n.save();
                        console.log(`Cart item notification to '${c.name}' scheduled for ${n.scheduleDate.toISOString()}`);
                    });
                });

            if (typeof next == "function")
                next(err, clients);
        });
    });
}
