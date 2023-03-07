var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:grape", function(req, res){
    var view = new keystone.View(req, res);
    var locals = res.locals;

    //set locals
    locals.section = 'store';

    //load grapes
    view.on('init', function (next){

        Grape.model.find({
            key: locals.filters.grape.cleanId()
        });

        //render view
        view.render('products');
    });;
})


exports = module.exports = router;