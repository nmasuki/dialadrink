var MoveSms = require("../../helpers/sms/MoveSMS");
var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

router.get('/', function(req, res, next){
    Client.model.find({})
        .exec((err, clients) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading clients list. " + err
                });

            var json = {
                response: "success",
                message: "",
                data: clients.map(c => c.toAppObject())
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
                data: client.toAppObject()
            };

            res.send(json);
        });
});


module.exports = router;