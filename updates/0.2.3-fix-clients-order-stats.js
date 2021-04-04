var keystone = require('keystone');
var Client = keystone.list('Client');

exports = module.exports = function (done) {
    console.log("Fixing clients order stats");
    Client.model.find()
        .sort({registrationDate: -1})
        .exec(function (err, clients) {
            var index = -1;
            
            (function updateClient(){
                console.log(`Extracting client from order ${index + 1}/${clients.length}`);
                var client = clients[++index];
                if(client)
                    client.save(updateClient);   
                else
                    done();                                     
            })();

            //done();
        });
};