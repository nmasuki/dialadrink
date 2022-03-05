var keystone = require('keystone');
var LocalStorage = require('../../helpers/LocalStorage');
var router = keystone.express.Router();

function logWebhook(req, res){
    var store = LocalStorage.getInstance("hooks");
    store.save({        
        headers: req.headers,
        origin: req.originalUrl || req.url,
        body: req.body,
        query: req.query
    });
}

router.post('/', logWebhook);
router.get('/', logWebhook);

exports = module.exports = router;