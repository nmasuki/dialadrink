var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list("Product");
var fs = require("fs");
//var StockTake = keystone.list("StockTake");
//var StockTakeItem = keystone.list("StockTakeItem");

var router = keystone.express.Router();
var dataDir = "../data/";
if (!fs.existsSync(dataDir)) fs.mkdir(dataDir);

function getAll(entityName){
    var all = {};
    if (fs.existsSync(dataDir + entityName + ".json"))
        all = JSON.parse(fs.readFileSync(dataDir + entityName + ".json" || "{}"));
    return all;
}

function saveAll(entityName, all){
    fs.writeFileSync(dataDir + entityName + ".json", JSON.stringify(all, null, 2));
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

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = (c == 'x' ? r : (r & 0x3 | 0x8));
        return v.toString(16);
    });
}

router.post("/:entity", function (req, res, next) {
    var all = getAll(req.params.entity);
    var entity = req.body || {};

    var updates = [],
        json = {
            response: "error",
            errors: []
        };

    function setEntiry(entity){
        var id = entity._id || entity.id || entity.Id || (entity._id = req.params.entity.toLowerCase() + "-" + uuidv4());

        if (all[id] && all[id].rev > entity._rev){
            var msg = ["Document conflict! ", id, all[id].rev , entity._rev].join("\t");
            json.errors.push(msg);

            updates.push({
                _id: null,
                _rev: entity._rev
            });

            return console.error(msg);
        }

        entity._rev = (entity._rev? 1: entity._rev + 1);
        all[id] = entity;

        updates.push({
            _id: id,
            _rev: entity._rev
        });
    }

    if(Array.isArray(entity) || Object.keys(entity).every((x, i) => x == i))
        Object.keys(entity).map(k => entity[k]).forEach(setEntiry);
    else
        setEntiry(entity);

    saveAll(req.params.entity, all);
    
    if (updates.length)
        json.response =  "success";
    
    json.message = json.errors.distinct().join(", ");
    if (updates.length > 1) {
        json._ids = updates.map(n => n._id);
        json._revs = updates.map(n => n._rev);
    } else if (updates.length) {
        json._id = updates[0]._id;
        json._rev = updates[0]._rev;
    }

    res.send(json);
});

router.delete("/:entity/:id", function (req, res, next) {});

module.exports = router;