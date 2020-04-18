var MoveSms = require("../../helpers/movesms");
var keystone = require('keystone');
var Client = keystone.list("Client");
var webpush = require("web-push");
var najax = require('najax');

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
                isValidNumber: !!client,
                isRegistered: !!(client && client.isAppRegistered)
            };

            if (client)
                res.send(json);
            else { 
                sms.validateNumber(mobile).then(function (response) {
                    json.isValidNumber = response.valid;
                    res.send(json);
                }).catch(function(){
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

router.post("/login", function (req, res) {
    var mobile = (req.body.mobile || "").cleanPhoneNumber();
    var password = req.body.password || "12345";

    if (!mobile || !password)
        return res.send({
            response: "error",
            message: "Username and password are required!!"
        });

    if(mobile == "254720805835")
    {
        console.log("Looking up number", mobile);
        sms.validateNumber(mobile).then((a,b,c) => { console.log("Lookup done!", a); });
    }

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