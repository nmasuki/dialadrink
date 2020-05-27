var keystone = require('keystone');
var cloudinary = require('cloudinary');
var LocalStorage = require('../../helpers/LocalStorage');
var router = keystone.express.Router();

router.get("/:entity", function (req, res, next) {
    var ls = new LocalStorage(req.params.entity);
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var start = (page - 1) * pageSize;
    var query = req.query.query || "";
    var regex = new RegExp("(" + query.escapeRegExp() + ")", "ig");
    
    var all = ls.getAll(), 
        filteredList = all.filter(a => !query || regex.test(JSON.stringify(a))),
        pageList = filteredList.slice(start, start + pageSize);

    console.log(req.params.entity  + " page:", page, "pageSize:", pageSize, "itemCount:", pageList.length);
    res.send({
        response: "success",
        fetchDate: new Date().toISOString(),
        data: pageList.map(ret => {
            if (res.locals.menuCounts && ret.href){
                var href = ret.href.replace(/^\/|\/$|(ie)?s$/, "");
                if (res.locals.menuCounts[href] != undefined)
                    ret.count = res.locals.menuCounts[href];                
            }
            
            if (!res.locals.appUser || res.locals.appUser.id != ret.id) {
                delete ret.httpAuth;
                delete ret.username;
                delete ret.password;
                delete ret.user_unique_code;
                delete ret.user_password;
            }
            return ret;
        })
    });
});

router.get("/:entity/:id", function (req, res, next) {
    var ls = new LocalStorage(req.params.entity);
    var data = ls.get(req.params.id);

    if(data){
        res.send({
            response: "success",
            data: data
        });
    }else{
        res.send({
            response: "error",
            message: "No data found for id:" + req.params.id,
            data: data
        });
    }
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