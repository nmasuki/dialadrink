var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

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
    function updateClient(client, jsonRes) {
        jsonRes = jsonRes || {
            response: "error"
        };
        if (client) {
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
    }

    if (res.locals.appUser)
        return updateClient(res.locals.appUser);
    else {
        console.log("Could not find user. params:", req.body);
        res.send({
            response: "error",
            message: 'Could not find user to update'
        });
    }
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
                json.message = "Mobile Already Exist";
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

    Client.model.find({
            phoneNumber: mobile
        })
        .exec((err, clients) => {

            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading registered users. " + err
                });

            var client = clients.find(c => password.comparePassword(c.password)) ||
                clients.find(c => !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd);

            var json = {
                response: "error"
            };

            if (client) {
                json.response = "success";
                json.message = "Login successfully";
                json.data = client.toAppObject();
                res.locals.appUser = client;

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

router.post("/register_fcm", function (req, res) {
    req.session.fcmCodes = [req.body.regId];
    var client = res.locals.appUser;
    var json = {
        response: "error",
        message: ''
    };

    if(!client){
        json.message = 'Attempting to register FCMCode before login.';
        return res.send(json);
    }else if (!client.fcmCodes || client.fcmCodes.indexOf(req.body.regId) < 0) {
        (client.fcmCodes || (client.fcmCodes = [])).push(req.body.regId);
        req.session.fcmCodes = client.fcmCodes;

        return client.save(function (err) {
            if (err){
                json.message = "Error while updating! " + err;
            } else {
                json.response = "success";
                json.message = "Token updated successfuly.";
            }

            return res.send(json);  
        });
    } else {
        req.session.fcmCodes = client.fcmCodes;
        json.response = "success";
        json.message = "Token already registered!";

        return res.send(json);
    }
});

module.exports = router;