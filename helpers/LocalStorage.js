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
            if (err){
                console.error("Could not aquire lock.", dataDir + entityName + ".lock", err);
                return reject(err);
            }
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
            entity._rev = entity._rev || entity.__v;
            
            var curRev = parseInt((all[id] && all[id]._rev || "0").toString().split('-')[0]);
            var docRev = parseFloat((entity._rev || "0").toString().split('-')[0]);

            if (all[id] && all[id]._rev && entity._rev && curRev > docRev) {
                var msg = ["Document conflict! ", id, all[id]._rev, entity._rev].join(",");
                errors.push({ _id: id, _rev: all[id]._rev, error: msg });
                return console.error(msg);
            }            

            entity._rev = (1 + curRev) + "-" + uuidv4();
            if (entity.__v) delete entity.__v;
            
            all[id] = all[id] || {};

            for (var i in entity){
                if (entity.hasOwnProperty(i) && (entity[i] || entity[i] === false)){
                    if(/^phone|^mobile/i.test(i) && /^[\d\s]+$/.test(entity[i]))
                        entity[i] = entity[i].cleanPhoneNumber();

                    if(/^password/i.test(i) && (entity[i] || "").length < 40)
                        entity[i] = (entity[i] || "").toString().encryptPassword().encryptedPassword;
                    
                    all[id][i] = entity[i];
                }
            }

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

