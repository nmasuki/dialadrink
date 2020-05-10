var MoveSms = require("../../helpers/sms/MoveSMS");
var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

router.get('/', function(req, res, next){
    console.log("Getting clients for app..");
    var filter = {};

    var PAGESIZE = 1500;
    if (req.query.bookmark){
        console.log("Loading Bookmark:" + req.query.bookmark);
        filter.$and = [{createdDate: { $gt: req.query.bookmark }}];
    }

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
        .limit(PAGESIZE)
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
                data: clients.map(c => c.toAppObject())
            };

            if (clients.length == PAGESIZE){
                json.bookmark = clients.last().createdDate.toISOString();
                if (json.bookmark <= req.query.bookmark)
                    delete json.bookmark;
                    
                console.log(
                    "Bookmark:" + json.bookmark, "\n",
                    "First:   " + clients.first().createdDate.toISOString(), "\n",
                    "Last:    " + clients.last().createdDate.toISOString()
                );
            }

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
                data: client.toAppObject()
            };

            res.send(json);
        });
});


module.exports = router;