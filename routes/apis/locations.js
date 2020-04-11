var keystone = require('keystone');
var Location = keystone.list("Location");

router.get("/", function (req, res) {
    var since = new Date(req.query.since || '2015-01-01');
    var filter = {
        modifiedDate: {
            $gt: since
        }
    };

    if (req.query.id)
        filter._id = typeof req.query.id == "string" ? req.query.id : {
            "$in": req.query.id.map(id => id)
        };

    Location.model.find(filter, function (err, locations) {
        var json = {
            response: "error",
            message: ""
        };

        if (err)
            json.message = "Error fetching drinks! " + err;
        else {
            json.response = "success";
            json.data = locations.map(p => p.toObject());
        }

        res.send(json);
    });
});