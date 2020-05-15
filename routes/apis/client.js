var MoveSms = require("../../helpers/sms/MoveSMS");
var keystone = require('keystone');
var Client = keystone.list("Client");
var Order = keystone.list("Order");

var router = keystone.express.Router();

router.get('/:id', function (req, res, next) {
    var filter = {
        $or: [{ _id: req.params.id }]
    };

    Client.model.findOne(filter)
        .exec((err, client) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading client. " + err
                });
            else if(!client){
                Order.model.findOne({client: req.params.id})
                    .exec((err, order) => {
                        if (err || !order || !order.delivery || !order.phoneNumber)
                            return res.send({
                                response: "error",
                                message: "Error while reading client. " + (err || "")
                            });

                        filter = {
                            $or: [{
                                phoneNumber: order.phoneNumber
                            }, {
                                phoneNumber: order.phoneNumber.cleanPhoneNumber()
                            }, {
                                phoneNumber: order.phoneNumber.cleanPhoneNumber().replace(/^254/, "0")
                            }].distinct()
                        };

                        Client.model.findOne(filter)
                            .exec((err, client) => {
                                    if (err)
                                        return res.send({
                                            response: "error",
                                            message: "Error while reading client. " + err
                                        });
                                    
                                    if(!client){
                                        client = new Client.model(order.delivery);
                                        client.save();
                                    }
                                    
                                    res.send({
                                        response: "success",
                                        message: "",
                                        data: client.toAppObject(res.locals.appVersion)
                                    });
                                });
                    });
            }else{
                res.send({
                    response: "success",
                    message: "",
                    data: client.toAppObject(res.locals.appVersion)
                });
            }
        });
});

router.get('/', function(req, res, next){
    console.log("Getting clients for app..");
    var filter = {};

    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 5000);
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
    
    if (res.locals.app == "com.dialadrinkkenya.rider") {
        
    } else if (res.locals.app == "com.dialadrinkkenya.office") {
        
    } else if (res.locals.appUser) {
        filter.$and = filter.$and || [];
        filter.$and.push({
            phoneNumber: {
                $in: [
                    res.locals.appUser.phoneNumber.cleanPhoneNumber(),
                    res.locals.appUser.phoneNumber.cleanPhoneNumber().replace(/^\+?245/, "0")
                ].distinct()
            }
        });
    } else {
         return res.send({
             response: "error",
             message: "Not Authorized"
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

module.exports = router;