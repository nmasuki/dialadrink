var keystone = require('keystone');
var Client = keystone.list('Client');

exports = module.exports = function (done) {
    Client.model.find({ $or:[{gender:null}, {gender:''}, {gender:false}]})
    .exec(function (err, clients) {
        console.log(`Looking up gender for ${clients.length} users!`);
        clients.forEach(client =>{
            if(client.name){
                var guessedGender = client.guessGender(client.name);
                if (guessedGender) {
                    client.gender = guessedGender.getGender();
                    client.save();
                }
            }
        });
        done();  
    });
};