var keystone = require('keystone');
var Product = keystone.list("Product");

var router = keystone.express.Router();

router.get("/", function (req, res) {
    var since = new Date(req.query.since || '2015-01-01');

    Product.findPublished({modifiedDate: { $gt: since}}, function (err, products) {
        var json = {
            response: "error",
            message: ""
        };

        if (err)
           json.message = "Error fetching drinks! " + err;
        else{
            json.response = "success";
            json.data = products.map(d => d.toAppObject());
        }

        res.send(json);
    });
});

router.get("/{query}", function(req, res, next){
    var query = req.params.query;
    Product.search(query, function (err, products) {
        var json = {
            response: "error",
            message: "",
            data: []
        };

        if (err)
           json.message = "Error fetching drinks! " + err;
        else if(products && products.length){
            json.response = "success";
            json.data = products.map(d => d.toAppObject());
        } else{            
            json.response = "success";
            json.message = "No record matching the query";
        }

        res.send(json);
    });
});

module.exports = router;