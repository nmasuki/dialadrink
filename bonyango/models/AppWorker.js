var keystone = require('keystone');
var Types = keystone.Field.Types;
var intervalMap = {
    'every 10 seconds': 10 * 1000,
    'every minute': 60 * 1000,
    'every 30 minutes': 30 * 60 * 1000,
    'hourly': 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
    'weekly': 7 * 24 * 60 * 60 * 1000,
    'monthly': 30 * 24 * 60 * 60 * 1000,
    'every 3 months': 3 * 30 * 24 * 60 * 60 * 1000,
    'every year': 365.25 * 24 * 60 * 60 * 1000
};

/**
 * AppWorker Model
 * ==================
 */

var AppWorker = new keystone.List('AppWorker', {
    autokey: {
        from: 'name',
        path: 'key',
        unique: true
    },
});

AppWorker.add({
    name: {
        type: String,
        required: true,
        initial: true,
        noedit: true
    },
    createdDate: {
        type: Types.Datetime,
        default: Date.now,
        index: true,
        noedit: true
    },
    lastRun: {
        type: Types.Datetime,
        index: true,
        noedit: true
    },
    runRequency: {
        type: Types.Select,
        options: Object.keys(intervalMap).join(", "),
        default: 'hourly',
        index: true
    },
    sequence: { type: String },
    sessions: {
        type: Types.TextArray,
        noedit: true
    },
    isActive: {
        type: Boolean
    },
    lockFile: {
        type: String,
        noedit: true
    }
});

AppWorker.schema.virtual("runInterval")
    .get(function () {
        return intervalMap[this.runRequency] || intervalMap.hourly;
    });

AppWorker.schema.virtual("runInterval")
    .set(function(value){
        var sortByNearestMatch = Object.keys(intervalMap).orderBy(k => Math.abs(intervalMap[k] - value));
        this.runRequency = sortByNearestMatch[0];
    });

AppWorker.schema.virtual("nextRun")
    .get(function () {
        var nextRun = new Date().getTime();
        if (this.lastRun)
            nextRun = this.lastRun.getTime() + (this.runInterval || 60000);

        return nextRun;
    });

AppWorker.defaultColumns = 'name|25%, runRequency|10%, lastRun, createdDate, isActive|10%';

AppWorker.register();