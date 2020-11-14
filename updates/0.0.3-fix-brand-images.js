var keystone = require('keystone');
var cloudinary = require('cloudinary');
var ProductBrand = keystone.list('ProductBrand');

exports = module.exports = function (done) {
    console.log("Extracting clients from brands...");
    ProductBrand.model.find({})
        .exec(function (err, brands) {
            var index = -1;
            brands = brands.filter(p => !!p && p.logo && p.logo.secure_url && p.logo.secure_url.toString().indexOf("/nmasuki/") > 0);

            (function fixNext(){
                console.log(`Extracting client from order ${index + 1}/${brands.length}...`);
                var brand = brands[++index];                
                if(brand){
                    if (brand.logo && brand.logo.secure_url)
                        cloudinary.v2.uploader.upload(brand.logo.secure_url, {public_id: "brands/" + brand.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    return fixNext(--index);
                                }
                                ProductBrand.model.find({_id: brand._id})
                                    .exec((err, p) => {
                                        p = p[0];
                                        p.logo = result;                                
                                        p.altImages = [result];
                                        p.save(err => {
                                            if (err){
                                                console.log(err, brand);
                                                return fixNext(--index);
                                            }
                                            console.log("Fixed brand image " + brand.name);                                    
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