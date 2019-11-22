var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ClientNotification Model
 * ==========
 */

var ClientNotification = new keystone.List('ClientNotification', {
	map: {
		name: 'message.title'
	}
});

ClientNotification.add({
	createdDate: {
		type: Types.Datetime,
		index: true,
		default: Date.now,
		noedit: true
	},
	scheduleDate: {
		type: Types.Datetime,
		index: true,
		default: Date.now,
		dependsOn: {
			type: 'pending'
		}
	},

	client: {
		type: Types.Relationship,
		ref: 'Client'
	},
	broudcast: {
		type: Types.Relationship,
		ref: 'ClientNotificationBroudcast',
		noedit: true
	},

	type: {
		type: Types.Select,
		options: 'email, sms, push',
		default: 'email',
		index: true
	},
	status: {
		type: Types.Select,
		options: 'pending, sent, rejected',
		default: 'pending',
		noedit: true
	},

	message: {
		title: {
			type: Types.Text
		},
		body: {
			type: Types.Html,
			wysiwyg: true,
			height: 150
		},
		icon: {
			type: Types.CloudinaryImage,
			folder: "notifications",
			dependsOn: {
				type: 'push'
			}
		},
	},
});

ClientNotification.defaultColumns = 'createdDate, scheduleDate, client, message.title, type|10%, status|10%';
ClientNotification.register();