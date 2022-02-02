var keystone = require('keystone');
var mongoose = require('mongoose');

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

mongoose.connect('mongodb://localhost:27017/lexir', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: false,
});

const IndustryMap = mongoose.model('Industry', new mongoose.Schema({}, { strict: false }))

var industies = [{
    name: 'Alcohol and beverages',
    title: 'Alcohol and beverages',
    modifiedDate: new Date('2020-01-02')
}]

function getWork(next, done) {
    var filter = {
        modifiedDate: { $gt: new Date(self.worker.lastRun || '2020-01-01') }
    };

    var vowels = "AEIOUY";
    var mapping = industies.filter(i => i.modifiedDate > filter.modifiedDate.$gt).map(p => {
        var map = {
            name: p.name, //:{ type: String, required: true },
            title: p.name, //:{ type: String, required: true },
            abr: p.name.toUpperCase().split('').filter(c => (c || '').trim() && vowels.indexOf(c) < 0).splice(0, 5).join('')
        };

        return map;
    })


    if (mapping.length)
        console.log("ETLing " + mapping.length + " industries " + filter.modifiedDate.$gt.toISOString());

    next(null, mapping, done);
}

function doWork(err, industries, next) {
    if (err)
        return console.warn(err);

    return new Promise((resolve) => {
        (function saveNext() {
            var p = industries.pop();
            if (!p) return resolve();

            var map = new IndustryMap(p);
            map.save(saveNext);
        })();
    }).then(next);
}