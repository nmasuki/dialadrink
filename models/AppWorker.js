var keystone = require('keystone');
var Types = keystone.Field.Types;

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
        options: 'every minute, hourly, daily, weekly, monthly, yearly',
        default: 'hourly',
        index: true
    },
    sequence: {
        type: String
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
        var f = {
            'every minute': 60 * 1000,
            'hourly': 60 * 60 * 1000,
            'daily': 24 * 60 * 60 * 1000,
            'weekly': 7 * 24 * 60 * 60 * 1000,
            'monthly': 30 * 24 * 60 * 60 * 1000,
            'yearly': 365.25 * 24 * 60 * 60 * 1000
        };

        return f[this.runRequency] || f.hourly;
    });

AppWorker.schema.virtual("nextRun")
    .get(function () {
        var nextRun = new Date().getTime();
        if (this.lastRun)
            nextRun = this.lastRun.getTime() + (this.runInterval || 60000);

        return nextRun;
    });

AppWorker.register();