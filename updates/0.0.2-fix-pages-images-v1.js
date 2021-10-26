var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Page = keystone.list('Page');

exports = module.exports = function (done) {
    console.log("Extracting clients from pages...");
    Page.model.find({})
        .exec(function (err, pages) {
            var index = -1;
            pages = pages.filter(p => !!p);

            (function fixNext(){
                console.log(`Fixing page ${index + 2}/${pages.length}...`);
                var page = pages[++index];                
                if(page){
                    if (page.bannerImages){
                        var promises = [];
                    
                        promises.push(new Promise((resolve) => {
                            var bannerImages =  [];
                            page.bannerImages.forEach((image, i) => {
                                console.log("Uploading " + image.secure_url);
                                cloudinary.v2.uploader.upload(image.secure_url, {public_id: "banners/" + page.name.cleanId()},
                                function (error, result) {
                                    if(error){
                                        console.error(error.message);
                                        if(error.http_code != 404) return fixNext(--index);
                                    }
    
                                    if(result) bannerImages.push(result);
                                    if(i + 1 >= page.bannerImages.length){
                                        page.bannerImages = bannerImages;
                                        resolve(page);
                                    } else {
                                        console.log(`Uploading main banner ${i + 1}/${page.bannerImages.length}`)
                                    }
                                });                
                            });
                        }));
                        
                        promises.push(new Promise((resolve) => {
                            var mobileBannerImages =  [];
                            page.mobileBannerImages.forEach((image, j) => {
                                console.log("Uploading " + image.secure_url);
                                cloudinary.v2.uploader.upload(image.secure_url, {public_id: "mobilebanners/" + page.name.cleanId()},
                                function (error, result) {
                                    if(error){
                                        console.error(error.message);
                                        if(error.http_code != 404) return fixNext(--index);
                                    }
    
                                    if(result) mobileBannerImages.push(result);
                                    if(j + 1 >= page.mobileBannerImages.length){
                                        page.mobileBannerImages = mobileBannerImages;
                                        resolve(page);
                                    } else {
                                        console.log(`Uploading mobile banner ${j + 1}/${page.mobileBannerImages.length}`)
                                    }
                                });                
                            });
                        }));
                    
                        Promise.all(promises).then(() => { 
                            console.log("Saving " + page.name);
                            page.save(fixNext);
                         });
                    }
                } else {
                    //done();
                }
            })();
            done();
        });
};