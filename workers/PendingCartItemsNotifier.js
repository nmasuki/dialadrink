var keystone = require('keystone');
var lockFile = require('lockfile');

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

    if (self.worker.sequence)
        filter.$and.push({
            expires: {
                $gt: self.worker.sequence
            }
        });

    if (opt && opt.cookie)
        if (process.env.NODE_ENV == "production") //skip this filter in testing
            filter.$and.push({
                expires: {
                    $lt: new Date().addSeconds(opt.cookie.maxAge / 1000).addDays(-5)
                }
            });

    db.collection('app_sessions')
        .find(filter)
        .sort({
            expires: 1
        })
        //.limit(50)
        .toArray((err, sessions) => {
            if (sessions && sessions.length) {
                console.log(`Found ${sessions.length} sessions with pending cart items..`);
                sessions = sessions.map(s => {
                    var sess = JSON.parse(s.session || "{}");

                    sess._id = s._id;
                    if (opt && opt.cookie)
                        sess.startDate = s.expires.addSeconds(-opt.cookie.maxAge / 1000);

                    return sess;
                });

                self.worker.sequence = sessions.max(s => s.cookie ? s.cookie.expires : '');
                self.worker.save();
            }

            next(err, sessions);
        });
}

function doWork(err, sessions, next) {
    var title = `You shopping cart at '${keystone.get("name")}'`;
    var body = "Hi {name}. You have some items waiting in your cart.";

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
                    c.sendNotification(title, body, null, {
                        sessionId: s._id,
                        buttons: ["Continue Shopping"]
                    });
                });

            if (typeof next == "function")
                next(err, clients);
        });
    });
}

var self = {
    run: function () {
        if (!self.lockFile)
            getWork(doWork);
        else
            lockFile.lock(self.lockFile, function (err) {
                if (err)
                    return console.warn("Could not aquire lock.", self.lockFile, err);

                getWork(function () {
                    var promise = doWork.apply(this, arguments);
                    if (!promise) {
                        self.nextRun = new Date().addMinutes(5);
                        lockFile.unlock(self.lockFile);
                    } else {
                        promise.finally(work => {
                            if (!work)
                                self.nextRun = new Date().addMinutes(5);

                            lockFile.unlock(self.lockFile);
                        });
                    }
                });
            });
    }
};

module.exports = self;