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
            all = JSON.parse(jsonStr.replace(/\/\*.*\*\//g, ""));
            if (all.data && all.response)
                all = all.data;
            
            for(var i in all){
                if(all.hasOwnProperty(i))
                    for(var j in all[i])
                        if (all[i].hasOwnProperty(j) && j.toString().toLowerCase().indexOf("date") > 0){
                            try {
                                all[i][j] = new Date(all[i][j]).toISOString();
                            }catch(e){
                                delete all[i][j];
                            }
                        }
            }
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

function LocalStorage(entityName) {
    var self = this;

    self.saveAll = function (all) {
        return self.save(all);
    };

    self.save = function (entity) {
        var all = getAll(entityName),
            updates = [],
            errors = [];

        function setEntiry(entity) {
            var id = entity._id || entity.id || entity.Id || (entity._id = entityName.toLowerCase() + "-" + uuidv4());

            if (all[id] && all[id].rev > entity.__v) {
                var msg = ["Document conflict! ", id, all[id].rev, entity.__v].join("\t");
                errors.push({
                    _id: id,
                    error: msg
                });

                return console.error(msg);
            }

            entity.__v = (entity.__v ? 1 + entity.__v.split('-')[0] : 1) + "-" + uuidv4();
            all[id] = all[id] || {};

            for (var i in entity){
                if (entity.hasOwnProperty(i) && (entity[i] || entity[i] === false))
                    all[id][i] = entity[i];
            }

            updates.push({
                _id: id,
                __v: entity.__v
            });
        }

        if (Array.isArray(entity) || Object.keys(entity).every((x, i) => x == i))
            Object.keys(entity).map(k => entity[k]).forEach(setEntiry);
        else
            setEntiry(entity);

        saveAll(entityName, all);
        return new Promise((resolve, reject) => {
            if (updates.length)
                return resolve({
                    updates,
                    errors
                });
            if (errors.length)
                return reject(errors);
        });
    };

    self.getAll = function () {
        var all = getAll(entityName);
        return Object.values(all);
    };

    self.get = function (id) {
        if (id == undefined)
            return self.getAll();
        var all = getAll(entityName);

        return all[id];
    };
}

LocalStorage.getInstance = function(e){ return new LocalStorage(e); }

module.exports = LocalStorage;

