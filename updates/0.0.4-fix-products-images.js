var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list('Product');

exports = module.exports = function (done) {
    console.log("Extracting clients from products...");
    Product.model.find({})
        .exec(function (err, products) {
            var index = -1;
            products = products.filter(p => !!p && p.image && p.image.secure_url && p.image.secure_url.toString().indexOf("/nmasuki/") > 0);

            (function fixNext(){
                console.log(`Extracting client from order ${index + 1}/${products.length}...`);
                var product = products[++index];                
                if(product){
                    if (product.image && product.image.secure_url)
                        cloudinary.v2.uploader.upload(product.image.secure_url, {public_id: "products/" + product.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    return fixNext(--index);
                                }
                                Product.model.find({_id: product._id})
                                    .exec((err, p) => {
                                       p=p[0];
					if(!p) return;
				        p.image = result;                                
                                        p.altImages = [result];
                                        p.save(err => {
                                            if (err){
                                                console.log(err, product);
                                                return fixNext(--index);
                                            }
                                            console.log("Fixed product image " + product.name);                                    
                                            return fixNext();
                                        });
                                    });
                                
                            });
                } else {
                    // done();
                }
            })();
            done();
        });
};
