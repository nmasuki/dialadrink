var keystone = require('keystone');
var mongoose = require('mongoose');

var Location = keystone.list('Location');

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

mongoose.connect('mongodb://localhost:27017/lexir', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: false,
});

const LocationMap = mongoose.model('Location', new Schema({}, { strict: false }))

function getWork(next, done) {
    var filter = {
        modifiedDate: { $gt: new Date(self.worker.lastRun || '2020-01-01') }
    };

    Location.model.find(filter)
        .exec(function (err, locations) {            
            if(err)
                return console.error("Error reading locations!", err || "Unknown");

            var vowels = "AEIOUYWH";
            var mapping = locations.map(p => {
                var map = {       
                    name : p.name, //{ type :String, required :true },
                    geo : {lng :p.location.lng, lat :p.location.lat },
                    county: 'Kenya', //{type :String, default :"" },
                    businesses : 1, //{type :Number, default :0},
                    isCity : false, //{ type :Boolean, default :false},
                    isLocation : true, //{ type :Boolean, default :true },
                    isCounty : false, //{ type :Boolean, default :false }
                    abr: p.name.toUpperCase().split('').filter(c => vowels.indexOf(c) < 0).splice(0,3).join('')
                };

                return map;
            })


            if(mapping.length)
                console.log("ETLing " + mapping.length + " locations " + filter.modifiedDate.$gt.toISOString());

            next(null, mapping, done);
        });
}

function doWork(err, locations, next) {
    if (err)
        return console.warn(err);

    return new Promise((resolve) => {
        (function saveNext(){
            var p = locations.pop();
            if(!p) return resolve();

            var map = new LocationMap(p);            
            map.save(saveNext);
        })();
    }).then(next);
}