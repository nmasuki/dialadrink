var keystone = require('keystone');
var cloudinary = require('cloudinary');
var ls = require('../../helpers/LocalStorage').getInstance("dashboarditem");
var router = keystone.express.Router();

router.get("/", function (req, res, next) {
    var ls = new LocalStorage(req.params.entity);
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var start = (page - 1) * pageSize;
    var query = req.query.query || "";
    var regex = new RegExp("(" + query.escapeRegExp() + ")", "ig");
    
    var accountType = res.locals.appUser && res.locals.appUser.accountType;
    var all = ls.getAll({ viewList:{ $elemMatch: accountType }}), 
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