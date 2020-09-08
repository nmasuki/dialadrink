var keystone = require('keystone');
var cloudinary = require('cloudinary');
var AppUser = keystone.list('AppUser');
var router = keystone.express.Router();

router.get("/", function (req, res, next) {
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var start = (page - 1) * pageSize;
    var query = req.query.query || "";
    var regex = new RegExp("(" + query.escapeRegExp() + ")", "ig");

    var sort = {};
	if(req.query.sort){
		var sortParts = req.query.sort.split(" ").filter(s => !!s);
		sort[sortParts[0]] = (sortParts[1] || "ASC").toUpperCase() == "ASC"? 1: -1;
	} else{
		sort = { createdDate: -1 };
    }

    AppUser.find({accountType: { $ne: null }}).then(users => {
        var sortProp = Object.keys(sort).first();
        var dir = sort[sortProp];
        if(dir == -1)
            return users.orderByDescending(u => u[sortProp] || u.createdDate);
        else
            return users.orderBy(u => u[sortProp] || u.createdDate);
    }).then(users => {
        var all = users || [], 
        filteredList = all.filter(a => !query || regex.test(JSON.stringify(a))),
        pageList = filteredList.slice(start, start + pageSize);

        console.log("AppUser page:", page, "pageSize:", pageSize, "itemCount:", pageList.length);
        res.send({
            response: "success",
            fetchDate: new Date().toISOString(),
            data: pageList.map(ret => {
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
    }).catch(err => {
        res.send({
            response: "error",
            message: "No data found! " + err
        });
    });
});

router.get("/:id", function (req, res, next) {
    AppUser.find({_id: req.params.id}).then(users => {
        var data = users && users[0];
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
    }).catch(err => {
        res.send({
            response: "error",
            message: "No data found for id:" + req.params.id,
            data: err
        });
    });
});

router.post("/", function (req, res, next) {
    var entity = req.body || {};
    
    var json = {
        response: "error",
        errors: []
    };
        
    AppUser.save(entity).then(updates => {
        json.response = "success";
        json._ids = updates.map(n => n._id);
        json._revs = updates.map(n => n._rev);
        
        res.send(json);
    }).catch(err => {
        json.message = err;
        res.send(json);
    });

});

module.exports = router;