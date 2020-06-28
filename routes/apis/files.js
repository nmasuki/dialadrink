var keystone = require('keystone');
var cloudinary = require('cloudinary');
var router = keystone.express.Router();

router.post('/upload', function (req, res) {
    console.dir(req.files);
    var json = {
        response: "error",
        errors: [],
        data: []
    };

    if(req.files){
        var ls = require("../../helpers/LocalStorage").getInstance("app-uploads");
        for(var i in req.files){
            var file = req.files[i];
            var options =  {public_id: "app-uploads/" + file.originalname };
            cloudinary.v2.uploader.upload(
                file.path, options,
                (error, result) => {
                    if(error)
                        json.errors.push(error);
                    else{
                        json.data.push(result.secure_url);
                        ls.save(result);
                    }
                    
                    var l = json.data.length + json.errors.length;
                    if(l >= Object.keys(req.files).length){
                        json.response = json.data.length? "success": "error";
                        console.log(json);
                        res.send(json);
                    }
                });
        }
    }
});

exports = module.exports = router;