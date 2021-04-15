var keystone = require('keystone');
var Client = keystone.list("Client");
var AppUser = keystone.list("AppUser");
var webpush = require("web-push");
var najax = require('najax');

var sms = require("../../helpers/sms").getInstance();

var router = keystone.express.Router();

var publicVapidKey = process.env.VAPID_PUBLIC_KEY;
var privateVapidKey = process.env.VAPID_KEY;

webpush.setVapidDetails(`mailto:${process.env.DEVELOPER_EMAIL}`, publicVapidKey, privateVapidKey);

router.get("/", function (req, res) {
	var client = res.locals.appUser;
	var filter = {};

	if (res.locals.app == "com.dialadrinkkenya.rider") {

    }
	else if (res.locals.app == "com.dialadrinkkenya.office") {

    }
	else {
		if (client)
			return res.send({
				response: "success",
				message: "User pulled from session!",
				data: client.toAppObject()
			});
		else if (req.query.mobile) {
			filter.phoneNumber = (req.query.mobile || "").cleanPhoneNumber()
		} else {
			return res.send({
				response: "error",
				message: "Username and password are required!!"
			});
		}
	}

	var page = parseInt(req.query.page || 1);
	var pageSize = parseInt(req.query.pageSize || 1500);
	var skip = page * pageSize;
	console.log("Looking up client..", "filter:", "page:", page, "pageSize:", pageSize, "skip:", skip);

	var sort = {};
	if(req.query.sort){
		var sortParts = req.query.sort.split(" ").filter(s => !!s);
		sort[sortParts[0]] = (sortParts[1] || "ASC").toUpperCase() == "ASC"? 1: -1;
	} else{
		sort = { firstName: 1, registrationDate: -1 };
	}

	Client.model.find(filter)
	.sort(sort)
	.skip(skip)
	.limit(pageSize)
	.exec((err, clients) => {
		if (err)
			return res.send({
				response: "error",
				message: "Error while reading registered users. " + err
			});

		var client = clients && clients[0];

		var json = {
			response: "error",
			message: "",
			data: {}
		};

		if (client) {
			json.response = "success";
			json.message = "Pulled details using mobile number.";
			json.data = client.toAppObject();
		} else {
			json.message = "No matching user record found!";
		}

		res.send(json);
	});
});

router.post("/", function (req, res) {
	var client = res.locals.appUser;
	var json = {
		response: "error",
		message: 'Error updating user'
	};

	if (client) {
		client.copyAppObject(req.body);

		json.response = "success";
		json.message = "Profile updated successfully";
		json.data = client.toAppObject();

		client.save();
		res.send(json);
	} else {
		console.log("Could not find user. params:", req.body);
		res.send(json);
	}
});

router.get("/sms/:mobile", function (req, res) {
	var mobile = (req.params.mobile || "").cleanPhoneNumber();
	var msg = (req.query.msg || "").trim();

	if (!msg)
		return res.send({
			response: "error",
			message: "No message defined!"
		});

	var _sms = new(require('../../helpers/sms/MySMS'))();
	_sms.sendSMS(mobile, msg).then(data => res.send({ response: "success", data: data }));
});

router.get("/check/:mobile", function (req, res) {
	var mobile = (req.params.mobile || "").cleanPhoneNumber();
	if (!mobile)
		return res.send({
			response: "error",
			message: "Mobile number required!!"
		});

	Client.model.find({ phoneNumber: mobile })
	.exec((err, clients) => {
		if (err)
			return res.send({
				response: "error",
				message: "Error while reading registered users. " + err
			});

		var client = clients && clients[0];
		var isRegistered = !!(client && client.isAppRegistered)
		var json = {
			response: "success",
			isValidNumber: !!client,
			isRegistered: isRegistered,
			data: isRegistered? client.toAppObject(): undefined
		};

		if (client) {
			res.send(json);
		} else {
			sms.validateNumber(mobile).then(function (response) {
				json.isValidNumber = response.valid;
				res.send(json);
			}).catch(function () {
				json.isValidNumber = true;
				res.send(json);
			});
		}
	});
});

router.post("/signup", function (req, res) {
	var mobile = (req.body.mobile || "").cleanPhoneNumber();
	var password = req.body.password || "";
	var gender = (req.body.gender || "M");

	if (!mobile || !password)
		return res.send({
			response: "error",
			message: "Username and password are required!!"
		});

	if (res.locals.app == "com.dialadrinkkenya.rider" || res.locals.app == "com.dialadrinkkenya.office") {
		AppUser.find({
			phoneNumber: mobile
		}).then(users => {
			var user = users && users[0];
			var json = {
				response: "error",
				message: "",
				data: {}
			};

			if (user) {
				json.response = "success";
				json.message = "User is already registered!";

				res.send(json);
			} else {
				user = {
					phoneNumber: mobile,
					password: password.encryptPassword().encryptedPassword,
					gender: gender.toUpperCase()
				};

				console.log("Saving appuser details.", {
					phone: client.phoneNumber,
					gender: client.gender
				});

				AppUser.save(user);

				json.response = "success";
				json.message = "Added Successfully";
				json.data = user;
				res.send(json);
			}
		}).catch(err => {
			if (err)
				res.send({
					response: "error",
					message: "Error while reading registered users. " + err
				});

		});
	} else {
		Client.model.find({
			phoneNumber: mobile
		})
		.exec((err, clients) => {

			if (err)
				return res.send({
					response: "error",
					message: "Error while reading registered users. " + err
				});

			var client = clients && clients[0];

			var json = {
				response: "error",
				message: "",
				data: {}
			};

			if (client && client.isAppRegistered) {
				json.response = "success";
				json.message = "User is already registered!";

				res.send(json);
			} else {
				client = client || new Client.model({});
				client.phoneNumber = mobile;
				client.password = password.encryptPassword().encryptedPassword;
				client.gender = gender.toUpperCase();

				console.log("Saving client details.", {
					phone: client.phoneNumber,
					gender: client.gender
				});

				client.save();

				json.response = "success";
				json.message = "Added Successfully";
				json.data = client.toAppObject();
				res.send(json);
			}
		});
	}
});

router.post(["/forgot", "/otp"], function (req, res) {
	var phoneNumber = req.body.mobile;
	var json = {
		response: "error",
		message: ''
	};

	console.log("Getting user: " + phoneNumber.cleanPhoneNumber());
	Client.model.findOne({
		phoneNumber: phoneNumber.cleanPhoneNumber()
	})
	.exec((err, client) => {
		if (err) {
			json.message = "Error while reading registered users. " + err;
		} else if (client) {
			client.sendOTP(req.body.otpToken);

			if (req.body.otpToken != undefined) {
				json.data = client.toAppObject();
				res.locals.appUser = client;

				if (req.sessionID && client.sessions.indexOf(req.sessionID) < 0)
					client.sessions.push(req.sessionID);
			}

			//TODO send SMS/Email.
			json.response = "success";
		} else {
			json.message = "User not found!";
		}

		return res.send(json);
	});
});

router.post("/login", function (req, res) {
	var mobile = (req.body.mobile || "").cleanPhoneNumber();
	var password = req.body.password || "12345";

	if (!mobile || !password)
		return res.send({
			response: "error",
			message: "Username and password are required!!"
		});

	console.log("Login attempt", mobile, password);
	if (res.locals.app == "com.dialadrinkkenya.rider" || res.locals.app == "com.dialadrinkkenya.office") {
		AppUser.find({ phoneNumber: mobile }).then(users => {
			var encrypted = password.encryptPassword().encryptedPassword;
			var user = users.find(c => encrypted == c.password  || c.passwords.contains(encrypted)) ||
				users.find(c => c.tempPassword && !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd);

			var json = { response: "error" };

			if (!user) {
				json.message = "Username/Password do not match!!";
			} else if(user.accountStatus != "Active"){
				json.message = `Account in ${user.accountStatus} status!`;
			} else {
                json.response = "success";
				json.message = "Login successfully";
				json.data = user;
                res.locals.appUser = user;
                
                user.sessions = user.sessions || [];
                user.clientIps = user.clientIps || [];
				
				var tosave = false;				
				if (user.tempPassword && !user.tempPassword.used && password == user.tempPassword.pwd) {
                    user.tempPassword.used = true;                 
                    tosave = true;
                } else if(user.password != encrypted){
					user.password = encrypted;
                    tosave = true;
				}

				if (req.sessionID && user.sessions.indexOf(req.sessionID) < 0){
                    user.sessions.push(req.sessionID);
                    tosave = true;
                }

				if (res.locals.clientIp && user.clientIps.indexOf(res.locals.clientIp) < 0) {
                    user.clientIps.push(res.locals.clientIp);
                    tosave = true;
                }
                
                if(tosave)
                    AppUser.save(user);

			}

			console.log(json.message);
			res.send(json);
		});
	} else {
		Client.model.find({phoneNumber: mobile})
		.exec((err, clients) => {

			if (err)
				return res.send({
					response: "error",
					message: "Error while reading registered users. " + err
				});

			var encrypted = password.encryptPassword().encryptedPassword;
			var client = clients.find(c => encrypted == c.password) ||
				clients.find(c => !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd);

			var json = { response: "error", data: null };

			if (client) {
				json.response = "success";
				json.message = "Login successfully";
				json.data = client.toAppObject();
				res.locals.appUser = client;

				if (client.sessions.indexOf(req.sessionID) < 0)
					client.sessions.push(req.sessionID);

				if (!client.tempPassword.used && password == client.tempPassword.pwd) {
					client.tempPassword.used = true;
					client.save();
				}
			} else {
				json.message = "Username/Password do not match!!";
			}

			res.send(json);
		});
	}

});

router.post("/webpush", function (req, res) {
	var json = {
		response: "success",
		message: 'Token updated successfuly!'
	};

	req.session.webpush = req.body;
	return res.status(201).send(json);
});

router.get('/webpush', function (req, res, next) {
	res.send(req.session.webpush || {});
});

router.post("/fcm", function (req, res) {
	var json = {
		response: "success",
		message: 'Token updated successfuly!'
	};

	var client = res.locals.appUser;
	console.log(`${client && client.name || 'New user'} FCM registration!`);

	if (req.session.fcm == req.body.regId) {
		json.message = "Same FCM token! No update required";
		console.log(json.message);
		return res.status(304).send(json);
	}

	req.session.fcm = req.body.regId;
	return res.status(201).send(json);
});

router.get('/fcm', function (req, res, next) {
	res.send(req.session.fcm || {});
});

module.exports = router;
