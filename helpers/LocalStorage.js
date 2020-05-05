var fs = require('fs');
var path = require('path');
var lockFile = require('lockfile');
var dataDir = path.resolve("../data/");

try{
    console.log("LocalStorage dir:", dataDir);
    if (!fs.existsSync(dataDir)) fs.mkdir(dataDir);
} catch(e){
    console.error(e);
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = (c == 'x' ? r : (r & 0x3 | 0x8));
        return v.toString(16);
    });
}

function getAll(entityName) {
    var all = {};
    
    try {
        if (fs.existsSync(path.resolve(dataDir, entityName + ".json"))){
            var jsonStr = (fs.readFileSync(path.resolve(dataDir, entityName + ".json")) || "{}").toString();
            all = JSON.parse(jsonStr);
        }
            
    } catch (e) {
        console.error(e);
    }

    return all;
}

function saveAll(entityName, all) {
    return new Promise((resolve, reject) => {
        lockFile.lock(path.resolve(dataDir, entityName + ".lock"), function (err) {
            if (err)
                return reject("Could not aquire lock.", dataDir + entityName + ".lock", err);
            
            fs.writeFile(path.resolve(dataDir, entityName + ".json"), JSON.stringify(all, null, 2), function (err) {
                lockFile.unlock(path.resolve(dataDir, entityName + ".lock"));

                if(err)
                    return reject(err);

                resolve();
            });
        });
    }).catch(console.error);
}

module.exports = function LocalStorage(entityName) {
    var self = this;

    self.saveAll = function(all){
        return self.save(all);
    };

    self.save = function (entity) {
        var all = getAll(entityName),
            updates = [], errors = [];
        
        function setEntiry(entity) {
            var id = entity._id || entity.id || entity.Id || (entity._id = entityName.toLowerCase() + "-" + uuidv4());

            if (all[id] && all[id].rev > entity._rev) {
                var msg = ["Document conflict! ", id, all[id].rev, entity._rev].join("\t");
                errors.push({
                    _id: id,
                    error: msg
                });

                return console.error(msg);
            }

            entity._rev = (entity._rev ? 1 + entity._rev.split('-')[0]: 1) + "-" + uuidv4();
            all[id] = entity;

            updates.push({
                _id: id,
                _rev: entity._rev
            });
        }

        if (Array.isArray(entity) || Object.keys(entity).every((x, i) => x == i))
            Object.keys(entity).map(k => entity[k]).forEach(setEntiry);
        else
            setEntiry(entity);

        saveAll(entityName, all);        
        return new Promise((resolve, reject) => {
            if(updates.length)
                return resolve({updates, errors});
            if(errors.length)
                return reject(errors);
        });
    };

    self.getAll = function(){
        return Object.values(getAll(entityName));
    };

    self.get = function(id){
        if(id == undefined)
            return self.getAll();
        var all = getAll(entityName);

        return all[id];
    };
};

