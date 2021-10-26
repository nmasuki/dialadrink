var keystone = require('keystone');
var najax = require('najax');
var cloudinary = require("cloudinary");
var ProductBrand = keystone.list('ProductBrand');

var docParser;
try {
    docParser = require('whacko');
} catch (e) {
    docParser = require("cheerio");
}
var logonoidUrl = "https://logonoid.com/category-alcohol/page-#/";

function lookUpLogo(page, brands) {
    console.log("Page " + page)
    var url = logonoidUrl.replace("#", page || 1);
    najax({
        url: url,
        success: function (html) {
            try {
                if (!html)
                    throw "Null response";
                else {
                    var $ = docParser.load(html);
                    var elems = Array.from($(".content-wrapper .thumbnail"));
                    elems.forEach(elem => {
                        var name = $(elem).find("span").text().trim().replace("Logo", "").trim();
                        var logo = $(elem).find("img").attr("src");
                        var brand = brands.find(b => b.name.cleanId().replace(/\W/g,"").contains(name.cleanId().replace(/\W/g,"")))
                        if (logo && brand)
                        {
                            console.log("Updating logo for " + name);
                            cloudinary.v2.uploader.upload("https://logonoid.com" + logo,
                                {public_id: "brands/" + brand.name.cleanId()},
                                function (error, result) {
                                    brand.logo = result;
                                    brand.save(err => {
                                        if (err)
                                            return console.log(err, brand);
                                        console.log("Updated brand logo " + brand.name);
                                    });
                                });
                        }
                        else
                            console.log(`Could not find brand ${name}`)
                    })
                }
            } catch (e) {
            }
        },
        error: function () {

        }
    });
}

exports = module.exports = function (done) {
    ProductBrand.model.find({}).exec(function (err, brands) {
        if (brands) {
            setTimeout(function(){
                for (var i = 1; i <= 5; i++)
                    lookUpLogo(i, brands);
                done();
            }, 30000)
         } else {
            done("No brands found!")
        }
    })
};
