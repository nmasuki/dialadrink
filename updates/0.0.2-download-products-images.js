var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list('Product');
var fs = require('fs'),
    path = require('path'),   
    request = require('request');

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

var downloadDir = path.resolve("../images");
if(!fs.existsSync(downloadDir))
    fs.mkdirSync(downloadDir);

exports = module.exports = function (done) {
    return  done();
    
    console.log("Downloading product images...");
    Product.model.find({})
        .exec(function (err, products) {
            var index = -1;

            (function fixNext(){
                console.log(`Extracting product image ${index + 1}/${products.length}...`);
                var product = products[++index];                
                if(product){
                    if (product.image && product.image.secure_url){
                        var images = [product.image].concat(product.altImages || []).distinctBy(img => img.key);
                        for(var i = 0; i < images.length; i++){
                            var img = images[i];
                            var url = img.secure_url;
                            var ext = img.format || "jpeg";
                            var filename = downloadDir + "/" + (product.name.cleanId()) + (i? '_' + i: '') + "." + ext;
                            download(url, filename, () => { 
                                if(i >= images.length - 1)
                                    fixNext();
                            });
                        }
                    } else
                        fixNext();
                } else {
                    done();
                }
            })();
        });
};