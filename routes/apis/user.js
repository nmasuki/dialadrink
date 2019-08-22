var keystone = require('keystone');
var Client = keystone.list("Client");

var router = keystone.express.Router();

router.post("/signup", function (req, res) {
    var mobile = (req.body.mobile || "");
    var password = req.body.password || "";
    var gender = (req.body.gender || "M");

    Client.model.find({phoneNumber: mobile.cleanPhoneNumber()})
        .exec((clients, err)=>{
            var match = clients.find(c=>password.comparePassword(c.password));
            if(!matched)
                match = clients.find(c=> !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd)
            
            var json = {response: "error", data: {} };            
            if(match){
                json.data = "Mobile Already Exist";
            }else{
                json.response = "success";
                json.data = "Added Successfully";                
            }

            res.send(json);
        });

});

router.post("/login", function (req, res) {
    var mobile = (req.body.mobile || "");
    var password = req.body.password || "";

    Client.model.find({phoneNumber: mobile.cleanPhoneNumber()})
        .exec((err, clients)=>{
            if(err)
                throw err;

            var client = clients.find(c=>password.comparePassword(c.password)) || 
                clients.find(c=> !c.tempPassword.used && c.tempPassword.expiry < Date.now() && password == c.tempPassword.pwd)

            var json = {response: "error" }; 
            if(client){
                json.response = "success";
                json.message = "Login successfully";  
                json.data = client.toAppObject();
            }else{
                json.error = "Username/password do not match!";
            }

            res.send(json);
        });

    });

router.post("/update", function (req, res) {
    var mobile = (req.body.mobile || "");
    Client.model.find({phoneNumber: mobile.cleanPhoneNumber()})
        .exec((clients, err)=>{
            if(err)
                throw err;

            var json = {response: "error", data: {} };            
            
            if(clients.length <= 0){
                json.data =  `No client found with number '${mobile.cleanPhoneNumber()}'`;
                return res.send(json);
            }

            clients.forEach((client, i) => {
                client.email = req.body.email;
                client.username = req.body.username;
                client.city = req.body.city;
                client.address = req.body.address;
                client.name = req.body.name;

                client.save(function(err){
                    
                    if(err){
                        json.data = err;
                    }else{
                        json.response = "success";
                        json.message = "Profile updated successfully";  
                        json = Object.assign(json, client.toAppObject());
                    }

                    if(i == 0)
                        res.send(json);
                });
            });
        });
});

module.exports = router;

