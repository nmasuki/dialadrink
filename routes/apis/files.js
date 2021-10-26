var keystone = require('keystone');
var cloudinary = require('cloudinary');
var router = keystone.express.Router();

var transformationMap = {
    "face": {
        width: 200,
        height: 200,
        gravity: "faces:center",
        radius: "max",
        crop: "fill"
    },
    "faces": {
        width: 200,
        height: 200,
        gravity: "faces",
        radius: "max",
        crop: "fill"
    },
};

router.post('/upload', function (req, res) {
    console.dir(req.files);
    var json = {
        response: "error",
        errors: [],
        data: []
    };

    var transformation = transformationMap[req.body.trans];
    if(req.files){
        var ls = require("../../helpers/LocalStorage").getInstance("app-uploads");
        for(var i in req.files){
            var file = req.files[i];
            var options =  { public_id: "app-uploads/" + file.originalname.split(".")[0] };

            cloudinary.v2.uploader.upload(file.path, options, (error, result) => {
                    if(error)
                        json.errors.push(error);
                    else {
                        if(transformation){
                            var cloudinaryOptions = {
                                secure: true,
                                transformation: [transformation]
                            };
                            var url = cloudinary.url(result.public_id, cloudinaryOptions);
                            console.log("Transfored url:", url);
                            json.data.push(url); 
                        }                            
                        else
                            json.data.push(result.secure_url); 
                                                   
                        ls.save(result);
                    }
                    
                    if(json.data.length + json.errors.length >= Object.keys(req.files).length){
                        json.response = json.data.length? "success": "error";
                        res.send(json);
                    }
                });
        }
    }
});

exports = module.exports = router;