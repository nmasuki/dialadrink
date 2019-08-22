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
        .exec((clients, err) => {
            var client = clients && clients[0];

            var json = {
                response: "error",
                data: {}
            };

            if (client && client.isAppRegistered) {
                json.data = "Mobile Already Exist";
                res.send(json);
            } else {
                client = client || new Client.model({});
                client.phoneNumber = mobile;
                client.password = password.encryptPassword();
                client.gender = gender.toUpperCase();

                client.save(function (err) {
                    if (err) {
                        json.message = err;
                    }else{
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
                throw err;

            var client = clients.find(c => password.comparePassword(c.password)) ||
                clients.find(c => !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd)

            var json = {
                response: "error"
            };

            if (client) {
                json.response = "success";
                json.message = "Login successfully";
                json.data = client.toAppObject();
            } else {
                json.message = "Username/password do not match!";
            }

            res.send(json);
        });

});

router.post("/update", function (req, res) {
    var mobile = (req.body.mobile || "");
    Client.model.find({
            phoneNumber: mobile.cleanPhoneNumber()
        })
        .exec((clients, err) => {
            if (err)
                throw err;

            var json = {
                response: "error",
                data: {}
            };

            if (clients.length <= 0) {
                json.data = `No client found with number '${mobile.cleanPhoneNumber()}'`;
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
                        json = Object.assign(json, client.toAppObject());
                    }

                    if (i == 0)
                        res.send(json);
                });
            });
        });
});

module.exports = router;