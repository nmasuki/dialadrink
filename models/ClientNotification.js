var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ClientNotification Model
 * ==========
 */

var ClientNotification = new keystone.List('ClientNotification', {
	map: {
		name: 'message.title'
	},
	defaultSort: '-createdDate',
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
		title: { type: Types.Text },
		body: { type: Types.Html, wysiwyg: true, height: 150 },
		icon: {
			type: Types.CloudinaryImage,
			folder: "notifications",
			dependsOn: { type: 'push' }
		}
	}
});

ClientNotification.schema.pre("save", function(next){
	ClientNotification.schema.options.strict = false;
	this.scheduleDate = adJustScheduleDate(scheduleDate); 
	next();
});

ClientNotification.schema.post("save", function(doc){
	ClientNotification.schema.options.strict = true;
});

function adJustScheduleDate(scheduleDate){
	scheduleDate = scheduleDate || new Date();
	if(scheduleDate < new Date().addMinutes(-0.5)) return scheduleDate;

	var scheduleTime = scheduleDate.toISOString().substr(11).split(":");
    var timeoffset = 3, preferedTime = "17:45", sendWindow = "11:00-22:00",
        preferedTimeHour = preferedTime.split(':')[0],
        preferedTimeMinute = preferedTime.split(':')[1],
        sendWindowStart = sendWindow.split('-')[0].split(':')[0], 
        sendWindowEnd = sendWindow.split('-')[1].split(':')[0];

    if (scheduleTime[0] > sendWindowEnd - timeoffset) {
        scheduleTime[0] = preferedTimeHour - timeoffset;
        scheduleDate = scheduleDate.addDays(1);
    } else if (scheduleTime[0] <= sendWindowStart - timeoffset) {
        scheduleTime[0] = preferedTimeHour - timeoffset;
        scheduleTime[1] = preferedTimeMinute;
    }

	return new Date(scheduleDate.toISOString().substr(0, 10) + "T" + scheduleTime.join(":"));
}

ClientNotification.defaultColumns = 'message.title, client, type|10%, status|10%, createdDate, scheduleDate';
ClientNotification.register();