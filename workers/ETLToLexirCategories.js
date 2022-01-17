var keystone = require('keystone');
var mongoose = require('mongoose');

var ProductCategory = keystone.list('ProductCategory');

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

mongoose.connect('mongodb://localhost:27017/lexir', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: false,
});

const CategoryMap = mongoose.model('ProductCategory', new mongoose.Schema({}, { strict: false }))

function getWork(next, done) {
    var filter = {
        modifiedDate: { $gt: new Date(self.worker.lastRun || '2020-01-01') }
    };

    ProductCategory.model.find(filter)
        .exec(function (err, categories) {            
            if(err)
                return console.error("Error reading categories!", err || "Unknown");

            var vowels = "AEIOUY";
            var mapping = categories.map(p => {
                var map = {         
                    _id: p._id,   
                    url: p.key,
                    image: p.image && p.image.secure_url || '',  //:{ type: String, required: true },                  
                    name: p.name,
                    title: p.pageTitle, //:{ type: String, required: true },
                    models: [],
                    metaDescription: p.description, //:{ type: String },
                    abr: (p.pageTitle + p.name).toUpperCase().split('').filter(c => (c||'').trim() && vowels.indexOf(c) < 0).splice(0, 5).join('')
                };

                return map;
            })


            if(mapping.length)
                console.log("ETLing " + mapping.length + " categories " + filter.modifiedDate.$gt.toISOString());

            next(null, mapping, done);
        });
}

function doWork(err, categories, next) {
    if (err)
        return console.warn(err);

    return new Promise((resolve) => {
        (function saveNext(){
            var p = categories.pop();
            if(!p) return resolve();

            var map = new CategoryMap(p);            
            map.save(saveNext);
        })();
    }).then(next);
}