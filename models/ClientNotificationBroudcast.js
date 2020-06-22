var keystone = require('keystone');
var Types = keystone.Field.Types;
var ClientNotification = keystone.list('ClientNotification');
var sms = require("../helpers/sms").getInstance();

/***************************************************
 * ClientNotificationBroudcast Model
 * =================================================*/

var ClientNotificationBroudcast = new keystone.List('ClientNotificationBroudcast', {
	    map: {
	    	name: 'messageTitle'
	    },
	    defaultSort: '-createdDate',
});

ClientNotificationBroudcast.add({
	status: {type: Types.Select, options: 'pending, sent', default: 'pending', noedit: true},    
	isActive:{type: Boolean, default: false, dependsOn: {status: 'pending'}},
	
	createdDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
	scheduleDate: {type: Types.Datetime, index: true, default: Date.now},
		
	messageTitle: {type: Types.Text, initial: true },
	type: {type: Types.Select, options: 'email, sms, push', default: 'email', index: true},	
	
	message: {
		pushTitle: {type: Types.Text, default:"" , dependsOn: {type: 'push'}},
		pushBody: {type: Types.Html, default:"", wysiwyg: true, height: 150 , dependsOn: {type: 'push'}},
		pushIcon: {type: Types.CloudinaryImage, folder: "notifications", dependsOn: {type: 'push'}},
		
		emailSubject: {type: Types.Text, default:"" , dependsOn: {type: 'email'}},
		emailBody: {type: Types.Html, default:"", wysiwyg: true, height: 150 , dependsOn: {type: 'email'}},	
		
		smsBody: {type: Types.Text, default:"", multiline: true, height: 150 , dependsOn: {type: 'sms'}},
		smsBalance: {type:Number, noedit: true , dependsOn: {type: 'sms'}},
	},

	target:{
		count: {type: Number, default: 30},
		type: {type: Types.Select, options: 'topCount, bottomCount', default: 'topCount', index: true},
		by: {type: Types.Select, options: 'orderCount, orderValue, registrationDate, lastOrderDate', default: 'orderCount', index: true},
	}
});

ClientNotificationBroudcast.relationship({
	ref: 'ClientNotification',
	refPath: 'broudcast'
});

ClientNotificationBroudcast.schema.virtual("msg").get(function(){
	var broudcast = this;
	var message = { title: broudcast.messageTitle };

	if (broudcast.type == "email") {
		message.title = broudcast.message.emailSubject || message.title;
		message.body = broudcast.message.emailBody;
	}

	if (broudcast.type == "sms") {
		message.body = broudcast.message.smsBody;
	}

	if (broudcast.type == "push") {
		message.title = broudcast.message.pushTitle || message.title;
		message.body = broudcast.message.pushBody;
		message.icon = broudcast.message.pushIcon;
	}

	return message;
});

ClientNotificationBroudcast.schema.post('init', function(next){
	var b = this;
	var smsBalance = ClientNotificationBroudcast.smsBalance;

	if(smsBalance != undefined)
		b.message.smsBalance = ClientNotificationBroudcast.smsBalance;
	else
		sms.balance().then(balance => b.message.smsBalance = (ClientNotificationBroudcast.smsBalance = balance));
});

ClientNotificationBroudcast.schema.pre('validate', function (next, obj, error) {
	var msg = this.msg;

	if(this.isActive && (!msg.title || !msg.body))
		next(new Error("Message must contain a 'title' and a 'body' before activating!"));
	else
		next();
});

ClientNotificationBroudcast.schema.pre('save', function (next) {
	var broudcast = this;
	
	if(!broudcast.isActive)
		return next();

	//Create ClientNotification for pending broudcasts without any
	ClientNotification.model.find({
		broudcast: broudcast._id
	}).exec((err, notifications) => {
		if(err)
			return next(err);

		if(notifications && notifications.length){
			notifications.filter(n => n.status == 'pending').forEach(n => {

				n.scheduleDate = broudcast.scheduleDate;
				n.broudcast = broudcast;
				n.type = broudcast.type;
				n.message = broudcast.msg;

				if (broudcast.status != "pending")
					broudcast.status = "pending";
					
				n.save();
			});
			return next();
		}		

		var sort = {};
		var filter = {};

		if(broudcast.target.type.startsWith("top"))
			sort[broudcast.target.by] = broudcast.target.by.contains("Date")? 1: -1;
		else
			sort[broudcast.target.by] = broudcast.target.by.contains("Date") ? -1 : 1;

		keystone.list("Client").model
			.find(filter)
			.sort(sort)
			.exec((err, clients) => {
				if(err)
					return next(err);
				
				if(clients && clients.length){

					//
					if(broudcast.type == "sms"){
						clients = clients.filter(c => c.phoneNumber);
					}else if (broudcast.type == "email"){
						clients = clients.filter(c => c.email);
					}else if (broudcast.type == "push"){
						return Promise.all(clients.map(c => {
							var count = 0;
							return c.getSessions().then(sessions => {
								var pushOrFCM = sessions.find(s => s.webpush || s.fcm);
								if (pushOrFCM && ++count <= broudcast.target.count) {
									var n = new ClientNotification.model({
										client: c,
										broudcast: broudcast,
										scheduleDate: broudcast.scheduleDate,
										type: broudcast.type,
										status: 'pending',
										message: broudcast.msg
									});

									n.save();
								}
							});
						}))
						.then(() =>  next())
						.catch(err => next(err));
					}

					//So as not to overwhelm the clients with notifications, send at most once every 5 days
					var notifyDateThreashold = new Date().addDays(-5);
					clients = clients.filter(c => c.lastNotificationDate == null || c.lastNotificationDate < notifyDateThreashold);
					
					//Pick top matches
					clients = clients.slice(0, broudcast.target.count || 2);

					//Create Notification per user
					clients.forEach(c => {
						var n = new ClientNotification.model({
							client: c,
							broudcast: broudcast,
							scheduleDate: broudcast.scheduleDate,
							type: broudcast.type,
							status: 'pending',
							message: broudcast.msg
						});

						n.save();
					});
				}

				return next();
			});	
	});
});

ClientNotificationBroudcast.defaultColumns = 'messageTitle, createdDate, scheduleDate, status|15%, type, target.count, target.type, target.by';

ClientNotificationBroudcast.register();