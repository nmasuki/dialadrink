var keystone = require('keystone');
var cloudinary = require('cloudinary');
var LocalStorage = require('../../helpers/LocalStorage');
var router = keystone.express.Router();

router.get("/:entity", function (req, res, next) {
    var ls = new LocalStorage(req.params.entity);
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var skip = (page - 1) * pageSize;
    
    var all = ls.getAll(), 
        pageList = all.slice(skip, skip + pageSize);

    console.log("Paging: page:", page, "pageSize:", pageSize, "itemCount:", pageList.length)
    res.send({
        response: "success",
        data: pageList
    });
});

router.get("/:entity/:id", function (req, res, next) {
    var ls = new LocalStorage(req.params.entity);
    res.send({
        response: "success",
        data: ls.get(req.params.id)
    });
});

router.post("/:entity", function (req, res, next) {
    var ls = new LocalStorage(req.params.entity);
    var entity = req.body || {};
    
    var json = {
        response: "error",
        errors: []
    };
        
    ls.save(entity).then(updates => {
        json.response = "success";
        json._ids = updates.map(n => n._id);
        json._revs = updates.map(n => n._rev);

        res.send(json);
    }).catch(err => {
        json.message = err;
        res.send(json);
    });

});

router.delete("/:entity/:id", function (req, res, next) {});

module.exports = router;