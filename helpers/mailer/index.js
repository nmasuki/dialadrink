var keystone = require('keystone');
var nodemailer = require('nodemailer');
var getSendOptions = require('./getSendOptions');

var transport;

function buildAddress(email, name) {
	if (name) {
		return name + ' <' + email + '>';
	} else {
		return email;
	}
}

function send(toSend, onSuccess, onFailure) {
	var message = toSend.message;
	var attachments = [];
	// create transport once
	if (!transport) {
		transport = nodemailer.createTransport(keystone.get('email nodemailer'));
	}

	if (message.attachments) {
		attachments = message.attachments.map(function (attachment) {
			return {
				cid: attachment.cid,
				filename: attachment.name,
				content: attachment.content,
				contentType: attachment.type,
				encoding: 'base64'
			};
		});
	}

	var mail = {
		from: buildAddress(message.from_email, message.from_name),
		to: message.to.map(to => buildAddress(to.email, to.name)).join(', '),
		cc: message.cc.map(to => buildAddress(to.email, to.name)).join(', ') || null,
		bcc: message.bcc.map(to => buildAddress(to.email, to.name)).join(', ') || null,
		subject: message.subject,
		html: message.html,
		attachments: attachments
	};

	if (message.sendPlainText) {
		if (typeof message.sendPlainText === 'object') {
			mail.text = htmlToText.fromString(message.html, message.sendPlainText);
		} else {
			mail.text = htmlToText.fromString(message.html);
		}
	}

	transport.sendMail(mail, function (error, info) {
		if (error) {
			onFailure({
				from: 'Email.send',
				key: 'send error',
				message: 'Nodemailer encountered an error and did not send the emails.',
				info: error.message
			});
		} else {
			onSuccess(null, info);
		}
	});
}

module.exports = function (email, options, callback) {
	options = Object.assign(getSendOptions(options), email);
	
	// validate
	if (!options.to.length) {
		return callback(new Error('No recipients to send to'));
	}

	process.nextTick(function () {
		// send
		send(
			{message: options},
			// onSuccess
			function (res) {
				callback(null, res);
			},
			// onError
			function (res) {
				callback(res);
			}
		);
	});
};