var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

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

                if (!client.tempPassword.used && password == client.tempPassword.pwd) {
                    client.tempPassword.used = true;
                    client.save();
                }
            } else {
                json.message = "Username/password do not match!";
            }

            res.send(json);
        });

});

router.post("/update", function (req, res) {
    var mobile = (req.body.mobile || "").cleanPhoneNumber();
    Client.model.find({
            phoneNumber: mobile
        })
        .exec((clients, err) => {

            if (err)
                return res.send({
                    response: "error",
                    message: "Error while reading registered users. " + err
                });


            var json = {
                response: "error",
                data: {}
            };

            if (!clients || clients.length <= 0) {
                json.data = `No client found with number '${mobile}'`;
                return res.send(json);
            }

            clients.forEach((client, i) => {
                client.email = req.body.email;
                client.username = req.body.username;
                client.city = req.body.city;
                client.address = req.body.address;
                client.name = req.body.name;

                client.save(function (err) {

                    if (err) {
                        json.data = err;
                    } else {
                        json.response = "success";
                        json.message = "Profile updated successfully";
                        json.data = client.toAppObject();
                    }

                    if (i == 0)
                        res.send(json);
                });
            });
        });
});

module.exports = router;