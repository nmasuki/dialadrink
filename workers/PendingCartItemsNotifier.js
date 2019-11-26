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

    if (self.worker.sequence){
        try{
            var ltExpirtDate = new Date(self.worker.sequence);
            filter.$and.push({
                expires: {
                    $gt: ltExpirtDate
                }
            });
        }catch(e){
            console.log(e);
        }
    }

    if (opt && opt.cookie){
        var expiryDate = new Date().addSeconds(opt.cookie.maxAge / 1000).addDays(-5)
        if (process.env.NODE_ENV == "production") //skip this filter in testing
            filter.$and.push({
                expires: {
                    $lt: expiryDate
                }
            });
    }

    db.collection('app_sessions')
        .find(filter)
        //.sort({ expires: -1 })
        //.limit(50)
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

                sessions = sessions.filter(s => s.webpush || s.fcm);
                console.log(`${sessions.length} sessions have push token..`);
            }

            next(err, sessions);
        });
}

function doWork(err, sessions, next) {
    var title = `Your shopping cart at '${keystone.get("name")}'`;
    var body = "Hi {firstName}. You have some items waiting in your cart.";

    sessions.forEach(s => {
        keystone.list("Client").model.find({
            sessions: {
                $elemMatch: {
                    $eq: s._id
                }
            }
        }).exec((err, clients) => {
            if (err)
                return console.error(err);

            if (clients)
                clients.forEach(c => {
                    var date = new Date().toISOString();

                    var scheduleDate = new Date(date.substr(0, 10));
                    var scheduleTime = date.substr(11).split(":");

                    if(scheduleTime[0] > 21 - 3){
                        scheduleTime[0] = 18 - 3;
                        scheduleDate = scheduleDate.addDays(1);
                    }

                    var n = new ClientNotification.model({
                        client: c,
                        scheduleDate: new Date(scheduleDate.toISOString().substr(0, 10) + "T" + scheduleTime.join(":")),
                        type: "push",
                        status: 'pending',
                        message: {
                            title: title.format(c),
                            body: body.format(c),
                            data:{
                                sessionId: s._id,
                                buttons: ["Continue Shopping"]
                            }
                        }
                    });

                    n.save();
                });

            if (typeof next == "function")
                next(err, clients);
        });
    });
}
