var MoveSms = require("../../helpers/movesms");
var keystone = require('keystone');
var Client = keystone.list("Client");
var webpush = require("web-push");

var sms = new MoveSms();

var router = keystone.express.Router();

var publicVapidKey = process.env.VAPID_PUBLIC_KEY;
var privateVapidKey = process.env.VAPID_KEY;

webpush.setVapidDetails(`mailto:${process.env.DEVELOPER_EMAIL}`, publicVapidKey, privateVapidKey);

router.get("/", function (req, res) {
    var client = res.locals.appUser;
    if (client)
        return res.send({
            response: "success",
            message: "User pulled from session!",
            data: client.toAppObject()
        });

    var mobile = (req.query.mobile || "").cleanPhoneNumber();

    if (!mobile)
        return res.send({
            response: "error",
            message: "Username and password are required!!"
        });

    Client.model.find({ phoneNumber: mobile })
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
                json.data = clien.toAppObject();
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
        client.save(function (err) {
            if (err) {
                json.data = err;
            } else {
                json.response = "success";
                json.message = "Profile updated successfully";
                json.data = client.toAppObject();
            }
            
            res.send(json);
        });
    } else {
        console.log("Could not find user. params:", req.body);
        res.send(json);
    }
});

router.get("/check/:mobile", function (req, res){
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
            var json = {
                response: "success",
                message: "",
                isRegistered: !!(client && client.isAppRegistered)
            };

            res.send(json);
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

    Client.model.find({ phoneNumber: mobile })
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
                    pwd: client.password,
                    gender: client.gender
                });

                client.save(function (err) {
                    if (err) {
                        json.message = err;
                        console.log(err);
                    } else {
                        json.response = "success";
                        json.message = "Added Successfully";
                        json.data = client.toAppObject();
                    }

                    res.send(json);
                });
            }
        });
});

router.post("/forgot", function(req, res){
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
        if (err){
            json.message = "Error while reading registered users. " + err;
        }
        else if(client){
            client.tempPassword = client.tempPassword || {used: true, expiry: new Date().addMinutes(5).getTime() };
            
            if(!client.tempPassword.password || client.tempPassword.used || client.tempPassword.expiry >= Date.now()){
                client.tempPassword.used = false;
                client.tempPassword.expiry = new Date().addMinutes(5).getTime();
                client.tempPassword.password = Array(7).join('x').split('').map((x)=>String.fromCharCode(65 + Math.round(Math.random()*25))).join('');
                
                client.save();
            }
            
            var msg = `<#>Your temporary password is ${client.tempPassword.password}`;
            sms.sendSMS(client.phoneNumber, msg + "\r\n" + process.env.APP_ID || "");
            
            //TODO send SMS/Email.
            json.response = "success";
            json.data = client.tempPassword.password;
        }else{
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

    Client.model.find({ phoneNumber: mobile })
        .exec((err, clients) => {

            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading registered users. " + err
                });

            var encrypted = password.encryptPassword().encryptedPassword;
            var client = clients.find(c => encrypted == c.password) ||
                clients.find(c => !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd);

            var json = { response: "error" };

            if (client) {
                json.response = "success";
                json.message = "Login successfully";
                json.data = client.toAppObject();
                res.locals.appUser = client;

                if(client.sessions.indexOf(req.sessionID) < 0)
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

});

router.post("/webpush", function (req, res) {
    req.session.webpush = req.body;
    
    var json = {
        response: "success",
        message: 'Token updated successfuly!'
    };

    return req.session.save(function (err) {
        if (err){
            json.response = "error";
            json.message = "Error while updating! " + err;
        }
        else
            return res.status(201).send(json);
        
        return res.send(json);  
    });
});

router.get('/webpush', function(req, res, next){
    res.send(req.session.webpush || {});
});

router.post("/fcm", function (req, res) {
    req.session.fcm = req.body.regId;
    
    var json = {
        response: "success",
        message: 'Token updated successfuly!'
    };

    return req.session.save(function (err) {
        if (err){
            json.response = "error";
            json.message = "Error while updating! " + err;
        }
        else
            return res.status(201).send(json);
        
        return res.send(json);  
    });
});

router.get('/fcm', function(req, res, next){
    res.send(req.session.fcm || {});
});


module.exports = router;