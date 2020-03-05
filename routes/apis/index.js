var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list("Product");
var fs = require("fs");
//var StockTake = keystone.list("StockTake");
//var StockTakeItem = keystone.list("StockTakeItem");

var router = keystone.express.Router();
if (!fs.existsSync("data/")) fs.mkdir("./data/");

function getAll(entityName){
    var all = {};
    if (fs.existsSync("data/" + entityName + ".json"))
        all = JSON.parse(fs.readFileSync("data/" + entityName + ".json" || "{}"));
    return all;
}

function saveAll(entityName, all){
    fs.writeFileSync("data/" + entityName + ".json", JSON.stringify(all, null, 2))
}

router.get("/:entity", function (req, res, next) {
    var all = getAll(req.params.entity);
    res.send({
        response: "success",
        data: Object.values(all)
    });
});

router.get("/:entity/:id", function (req, res, next) {
    var all = getAll(req.params.entity);
    res.send({
        response: "success",
        data: all[req.params.id]
    });
});

router.post("/:entity", function (req, res, next) {
    var all = getAll(req.params.entity);
    var entity = req.body || {};
    var id = entity._id || entity.id || entity.Id
    if(!id)
        entity.id = id = Math.random().toString().replace("0.", "");
    
    all[id] = entity;
    saveAll(req.params.entity, all);

    res.send({
        response: "success",
        data: entity
    });
});
router.delete("/:entity/:id", function (req, res, next) {});

module.exports = router;