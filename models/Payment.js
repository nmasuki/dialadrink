var keystone = require('keystone');
var Types = keystone.Field.Types;

var Payment = new keystone.List('Payment', {
    defaultSort: '-paymentDate'
});

Payment.add({
    paymentDate: {
        type: Types.Datetime,
        index: true,
        default: Date.now,
        noedit: true
    },
    amount: {
        type: String,
        noedit: true
    },
    status: {
        type: String,
        noedit: true
    },
    productName: {
        type: String,
        noedit: true
    },
    phoneNumber: {
        type: String,
        noedit: true
    },
    transactionId: {
        type: String,
        noedit: true
    },
    referenceId: {
        type: String,
        noedit: true
    },
    notificationType: {
        type: String,
        noedit: true
    },
    metadataJson: {
        type: String,
        noedit: true
    },
});

Payment.schema.virtual("metadata").set(function (value) {
    value = Object.assign(this.metadata, value || {});
    if (value) {
        var keys = Object.keys(value || {});
        var mapping = {
            'account': ['clientAccount'],
            'transactionId': ["transaction"],
            'referenceId': ["order", "receipt"],
            'notificationType': ["provider"],
            'phoneNumber': [],
            'status': ['state'],
            'amount': ['amount', 'value'],
            'productName': []
        };

        for (var i in mapping) {
            var key = keys.find(k => k.toLowerCase().contains(i) || mapping[i].any(m => k.toLowerCase().contains(m)));
            if (key) {
                this[key] = this[key] || value[key];

                if (key == 'metadata') {
                    for (var j in value[key])
                        value[j] = value[key][j] || value[j];
                }
            }
        }

        this.metadataJson = JSON.stringify(value || {});

    }
});

Payment.schema.virtual("metadata").get(function () {
    var json = this.metadataJson || {};
    try {
        return JSON.parse(json);
    } catch (e) {
        return {};
    }
});

Payment.defaultColumns = 'paymentDate|15%, amount|15%, status';

Payment.register();