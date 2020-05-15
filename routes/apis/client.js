var keystone = require('keystone');
var Client = keystone.list("Client");
var Order = keystone.list("Order");

var router = keystone.express.Router();

function getClientByReq(req, res, next){
    var filter = { $or:[]};

    req.body = req.body || {};
    req.params = req.params || {};
    req.query = req.query || {};
    var id = req.body._id || req.params.id || req.query.id;

    if(id)
        filter.$or.push({ _id: id });
    
    if(req.body.phoneNumber || req.query.mobile){
        var phoneNumber = req.body.phoneNumber || req.params.mobile || req.query.mobile;
        filter.$or.push({ phoneNumber: phoneNumber.cleanPhoneNumber() });
        filter.$or.push({ phoneNumber: phoneNumber.cleanPhoneNumber().replace(/\+?254/, "0") });
        filter.$or.push({ phoneNumber: phoneNumber });
    }

    Client.model.findOne(filter)
        .exec((err, client) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading client. " + err
                });
            else if (!client) {
                Order.model.findOne({ client:  id })
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

                                if (!client) {
                                    client = new Client.model(order.delivery);
                                    client.save(err => next(client));
                                }else
                                    next(client);
                            });
                        });
            } else {
                next(client);
            }
        });
}

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
                data: clients.map(c => c.toAppObject())
            };

            res.send(json);
        });

});

router.get('/:id', function (req, res, next) {
    getClientByReq(req, res, client => {
        res.send({
            response: "success",
            message: "",
            data: client.toAppObject()
        });
    });
});

router.post("/", function (req, res) {
    getClientByReq(req, res, client => {
        var message = "";
        if(!client){
            client = new Client.model(req.body);
            message = "Created new client!";
        }else{
            message = "Updating client record!";
            if (req.body.__v && req.body.__v < client.__v)
               return res.send({
                   response: "error",
                   message: `Document Conflict! Rev: ${client.__v} Your's: ${req.body.__v}`,
                   data: client.toAppObject()
               });            
        }

        client.save(err => {
            if(err)
                return res.send({
                    response: "error",
                    message: "Error while saving client details. " + err
                });
            
            res.send({
                response: "success",
                message: message,
                data: client.toAppObject()
            });
        });

    });
});

module.exports = router;