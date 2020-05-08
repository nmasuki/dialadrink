var MoveSms = require("../../helpers/sms/MoveSMS");
var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

router.get('/', function(req, res, next){
    console.log("Getting clients for app..");
    var filter = {};

    var PAGESIZE = 700;
    if (req.query.bookmark){
        console.log("BM:" + req.query.bookmark);
        filter.createdDate = { $gt: req.query.bookmark };
    }

    Client.model.find({})
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
                console.log(
                    "Bookmark:" + json.bookmark, "\n",
                    "First:   " + clients.first().createdDate.toISOString(), "\n",
                    "Last:    " + clients.last().createdDate.toISOString()
                );

                if (json.bookmark == req.query.bookmark)
                    json.bookmark = new Date().addMilliseconds(1).toISOString();
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