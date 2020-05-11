var MoveSms = require("../../helpers/sms/MoveSMS");
var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

router.get('/', function(req, res, next){
    console.log("Getting clients for app..");
    var filter = {};

    var page = req.query.page || 1;
    var pageSize = req.query.pageSize || 1500;
    var skip = (page - 1) * pageSize;
    console.log("Looking up clients..", "page:", page, "pageSize:", pageSize, "skip:", skip);

    if (req.query.query && req.query.query.trim()) {
        var fields = ["firstName", "lastName", "phoneNumber", "houseNumber", "username"];
        var regex = new RegExp(req.query.query.trim().escapeRegExp(), "i");
        filter.$or = [];
        fields.forEach(f => {
            x = {};
            x[f] = regex;
            filter.$or.push(x);
        });
    }

    Client.model.find(filter)
        .sort({createdDate: 1})
        .skip(skip)
        .limit(pageSize)
        .exec((err, clients) => {
            if (err){
                console.log("Error!", err);
                return res.send({
                    response: "error",
                    message: "Error while reading clients list. " + err
                });
            }

            console.log("Found " + clients.length + " clients.");
            var json = {
                response: "success",
                message: "",
                data: clients.map(c => c.toAppObject(res.locals.appVersion))
            };

            res.send(json);
        });

});

router.post("/", function (req, res) {
    return res.send({
        response: "error",
        message: "Method not implimented!"
    });
});

router.get('/:id', function(req, res, next){
    var filter = {
        $or: [{
            _id: req.params.id
        }]
    };

    Client.model.find({
            filter
        })
        .exec((err, client) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading clients list. " + err
                });

            var json = {
                response: "success",
                message: "",
                data: client.toAppObject(res.locals.appVersion)
            };

            res.send(json);
        });
});


module.exports = router;