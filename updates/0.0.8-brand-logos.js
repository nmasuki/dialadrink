var keystone = require('keystone');
var najax = require('najax');
var cloudinary = require("cloudinary");
var ProductBrand = keystone.list('ProductBrand');
var ProductCategory = keystone.list('ProductCategory');

var docParser;
try {
    docParser = require('whacko');
} catch (e) {
    docParser = require("cheerio");
}
var googleKeyUsage = {
    _id: "Google:" + new Date().addHours(-10 + 3).toISOString().substr(0, 10),
    dailyLimit: 100,
    usage: {
        'AIzaSyBGzl7yhwd0kEmRN9qYP7hmq6uvII8o7Sk': 0,
        'AIzaSyAgqLVvMJluK3-65169vjm8GDCc4d3LK1I': 0,
        'AIzaSyAWF4-UBqugwC2LhGFlRsti1bm7CSJNwlA': 0,
        'AIzaSyDrTQ_gRXhHpbOcaERWR4ykcxK9fXZJbso': 0,
        'AIzaSyBQsWkz6-MIHTbPQrj220rLkwRFE7OD1-Q': 0
    }
};

function googleSearch(content, callback) {
    (function apiCal() {
        var api_key = Object.keys(googleKeyUsage.usage).orderBy(k => googleKeyUsage.usage[k]).first();
        var url = `https://www.googleapis.com/customsearch/v1?key=${api_key}&cx=002193200989192095014:iz7f4t9msrk&q=${content}`;

        googleKeyUsage.usage[api_key] += 1;
        najax.get({
            url: url,
            dataType: 'json',
            success: function (data) {
                if (typeof callback == "function")
                    callback(null, data)
            },
            error: function (xhr, status, err) {
                var msg = xhr.responseText || err.message;
                console.log("Error while calling Google search..\n", msg);
                if (err.code == "ECONNRESET")
                    setTimeout(apiCal, 5000 + Math.random() * 10000)
                else if (typeof callback == "function")
                    callback(err)
            }
        });
    })();
}

exports = module.exports = function (done) {
    ProductBrand.model.find({}).exec(function (err, brands) {
        if (brands) {
            brands.forEach(function (brand, i) {
                var isLast = i >= brands.length - 1;

                function pickLogo(logos) {
                    logos = logos || brand.logos;
                    var logo = logos.find(i => i.toLowerCase().contains("logo"));
                    if (logo)
                        cloudinary.v2.uploader.upload(logo,
                            {public_id: "brands/" + brand.name.cleanId()},
                            function (error, result) {
                                brand.logo = result;
                                brand.save(err => {
                                    if (err)
                                        return console.log(err, brand);
                                    console.log("Added brand logo " + brand.name);
                                });
                            });
                    return logo;
                }

                function searchLogos(surFix) {
                    var search = brand.company.name + " " +  brand.name + " " + (surFix || "logo");
                    googleSearch(search.trim(), (err, data) => {
                        var logos = (data.items || data.data)
                            .map(i => i.pagemap && i.pagemap.cse_image && i.pagemap.cse_image.flatten(t => t.src))
                            .filter(s => !!s)
                            .map(s => s[0]);
                        if (!pickLogo(logos))
                            brand.save();
                        else
                            console.log("No matching log found for '" + brand.name + "'")
                    });
                }

                if (!brand.logos || !brand.logos.length)
                    searchLogos();
                else if (!brand.logo || !brand.logo.public_id) {
                     var logo = pickLogo(brand.logos);
                     if (!logo)
                         searchLogos("brand logo");
                }

                if (isLast) done();
            });
        } else {
            done("No brands found!")
        }
    })
};
