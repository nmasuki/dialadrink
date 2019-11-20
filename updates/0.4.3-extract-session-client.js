var keystone = require('keystone');
var Client = keystone.list('Client');

exports = module.exports = function (done) {
    const {
        db
    } = keystone.mongoose.connection;
    var filter = {
        session: /(userData)/
    };

    db.collection('app_sessions')
        .find(filter).toArray((err, sessions) => {
            if (sessions) {
                var promise = sessions.aggregate(Promise.resolve(), (p, s) => {
                    return p.then(() => {
                        var sess = JSON.parse(s.session || "{}");
                        var findOption = {
                            "$or": []
                        };

                        if (sess.userData) {
                            if (sess.userData.phoneNumber)
                                findOption.$or.push({
                                    phoneNumber: sess.userData.phoneNumber.trim().cleanPhoneNumber()
                                });

                            else if (sess.userData.email)
                                findOption.$or.push({
                                    email: new RegExp(sess.userData.email.trim().escapeRegExp(), "i")
                                });

                            if (findOption.$or.length)
                                return Client.model.find(findOption).exec((err, clients) => {
                                    if (!clients || clients.length <= 0) {
                                        var c = new Client.model(sess.userData);
                                        c.sessions.push(s._id);
                                        c.sessions = c.sessions.distinct();
                                        return c.save();
                                    } else {
                                        if (clients.length > 1)
                                            console.log("Matching more than one client!", sess.userData.email, sess.userData.phoneNumber);

                                        return clients.map(c => {
                                            c.sessions.push(s._id);
                                            c.sessions = c.sessions.distinct();
                                            return c.save();
                                        });
                                    }
                                });
                        }

                        return Promise.resolve();
                    });
                });
                done();
                promise.then(() => console.log("SessionId extraction done!"));
            }
        });
};