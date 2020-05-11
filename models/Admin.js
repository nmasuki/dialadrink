var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Admin Model
 * ==========
 */
var Admin = new keystone.List('Admin');

Admin.add({
    name: {
        type: Types.Name,
        required: true,
        index: true
    },
    phoneNumber: {
        type: Types.TextArray
    },
    email: {
        type: Types.Email,
        initial: true,
        required: true,
        index: true
    },
    password: {
        type: Types.Password,
        initial: true,
        required: true
    },
    accountStatus: {
        type: Types.Select,
        options: 'Pending,Active,Deactivated',
        default: 'Pending',
        index: true
    },
    
}, 'Permissions', {
    isAdmin: {
        type: Boolean,
        label: 'Can access Keystone',
        index: true
    },
    receivesOrders: {
        type: Boolean,
        label: 'Receive Orders',
        index: true
    },
    appPermissions: { type: Types.TextArray, default:["office"] },

});


/**
 * Relationships
 */
Admin.relationship({
    ref: 'Blog',
    path: 'blogs',
    refPath: 'author'
});


// Provide access to Keystone
Admin.schema.virtual('canAccessKeystone').get(function () {
    return this.isAdmin;
});

// authorization for http request
Admin.schema.virtual("httpAuth")
    .get(function () {
        var str = [user.phoneNumber, user.password, new Date().getTime()].join(':')
        return Buffer.from(str).toString('hex');
    });

// authorization for http request
Admin.schema.virtual("firstName")
    .get(function () {
        return this.name.first;
    });
// authorization for http request
Admin.schema.virtual("lastName")
    .get(function () {
        return this.name.last;
    });


Admin.schema.set('toObject', {
    transform: function (doc, ret, options) {
        return ret;
    }
});

/**
 * Registration
 */
Admin.defaultColumns = 'name, email, isAdmin, receivesOrders, appPermissions';
Admin.register();
