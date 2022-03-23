var fs = require('fs');
var path = require('path');
var lockFile = require('lockfile');
var dataDir = path.resolve("../data/");
var { mongoFilterToFn } = require('./filters');

try{
    console.log("LocalStorage dir:", dataDir);
    if (!fs.existsSync(dataDir)) fs.mkdir(dataDir);
    //TODO unlock any pending locks
    /* entities.forEach(entityName => {
        lockFile.unlock(path.resolve(dataDir, entityName + ".lock"));
    }); /**/
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
            var startIndex = Math.min(
                jsonStr.contains("[")? jsonStr.indexOf("["): 0,
                jsonStr.contains("{")? jsonStr.indexOf("{"): 0
            );

            all = JSON.tryParse(jsonStr.substr(startIndex)) || {};
            if (all.data && all.response)
                all = all.data;
            
            if(Array.isArray(all)){
                var obj = {};
                all.forEach(a => {
                    var id = a._id || a.id || a.Id || (a._id = entityName.toLowerCase() + "-" + uuidv4());
                    obj[id] = a;
                });

                all = obj;
            }
            
            for(var i in all){
                if(all.hasOwnProperty(i)){
                    for(var j in all[i])
                        if (all[i].hasOwnProperty(j) && /^date|date$/i.test(j.toString())){
                            var parseDate = Date.tryParse(all[i][j]);
                            all[i][j] = parseDate? parseDate.toISOString(): undefined; 
                        }
                }
            }
        } 
    } catch (e) {
        console.error(entityName + ".json", e);
    }

    return all;
}

var saveAll = function (entityName, all) {
    return new Promise((resolve, reject) => {
        var filePath = path.resolve(dataDir, entityName + ".json");
        var lockFilePath = path.resolve(dataDir, entityName + ".lock");

        console.log("Aquiring lock ", lockFilePath);
        lockFile.lock(lockFilePath, function (err) {
            if (err){
                console.warn("Could not aquire lock.", err);
                setTimeout(function(){ 
                    console.log("Retrying save..");
                    saveAll(entityName, all).then(resolve).catch(reject); 
                }, 100);
            }
            
            fs.writeFile(filePath, JSON.stringify(all, null, 2), function (err) {
                console.log("Saved to file", filePath, "Releasing lock", lockFilePath);
                lockFile.unlock(lockFilePath);

                if(err)
                    return reject(err);
    
                resolve();
            });
        });
    }).catch(console.error);
}.debounce(10);

function LocalStorage(entityName) {
    var self = this;

    self.saveAll = function (entity) { return self.save(entity); };

    self.save = function (entity) {
        var all = getAll(entityName), updates = [], errors = [];

        var setEntiry = function (entity) {
            var id = (entity._id || entity.id || entity.Id || entity.public_id || (entity._id = entityName.toLowerCase() + "-" + uuidv4())).toString();
            entity._rev = entity._rev || entity.__v;      
            
            if(id && id.startsWith("temp:")){
                entity._id = id = id.split(":")[1] || (entityName.toLowerCase() + "-" + uuidv4());
                delete entity._rev;
            }

            var curRev = parseInt((all[id] && all[id]._rev || "0").toString().split('-')[0]);
            var docRev = parseFloat((entity._rev || "0").toString().split('-')[0]);

            var curRevGuid = (all[id] && all[id]._rev || "").toString().split('-').splice(1).join('-');
            var docRevGuid = (entity._rev || "0").toString().split('-').splice(1).join('-');

            if(!docRev || curRevGuid == docRevGuid)
                entity._rev = parseInt(1 + curRev) + "-" + uuidv4();
            else if(docRev > curRev){
                if(Math.abs(docRev - curRev) < 1)
                    entity._rev = parseInt(1 + docRev) + "-" + uuidv4();
                else
                    entity._rev = parseInt(docRev) + "-" + uuidv4();
                //TODO Log possible confict
            } else if (all[id] && all[id]._rev && entity._rev && curRev > docRev) {
                var msg = ["Document conflict! ", id, all[id]._rev + " --> " + entity._rev].join("\n\t-");
                errors.push({ _id: id, _rev: all[id]._rev, error: msg });
                return console.error(msg);
            }
            
            if (entity.__v) delete entity.__v;       
            
            if(all[id] && entityName != "appuser"){
                console.log(
                    "Updating " + entityName + "..\n\t _id:" + id + ",", 
                    "_rev:" + all[id]._rev + " ---> " + entity._rev
                );
            }

            all[id] = all[id] || { _id: id, _rev: curRev, createdDate: new Date() };
            
            var userId = global.appUser && global.appUser._id || null;
            if(all[id].createdBy && all[id].createdBy._id)
                all[id].createdBy = all[id].createdBy._id;
            
            entity.createdBy = all[id].createdBy || userId;
            entity.lastModifiedBy = userId;

            entity.modifiedDate = new Date();
            for (var i in entity){
                if (entity.hasOwnProperty(i) && (entity[i] || entity[i] === false)){
                    if(/^phone|^mobile/i.test(i) && /^[\d\s]+$/.test(entity[i] || ""))
                        entity[i] = entity[i].cleanPhoneNumber();
                    else if(/^password/i.test(i)){
                        if(entity[i] && !/^(\$\w\w){3}/.test(entity[i] || ""))//Reset password
                            entity[i] = (entity[i] || "").toString().encryptPassword().encryptedPassword;
                        else if(all[id][i])
                            continue;//Don't change password
                    } 
                    
                    all[id][i] = entity[i];
                }
            }

            updates.push({ _id: id, _rev: entity._rev });
        }

        return new Promise((resolve, reject) => {
            if (Array.isArray(entity) || Object.keys(entity).every((x, i) => x == i)){
                var list = Object.keys(entity).map(k => entity[k]);
                list.forEach(setEntiry);
                console.log(`Saving ${list.length} items..`);
            } else{
                setEntiry(entity);
                console.log(`Saving..`);
            }

            saveAll(entityName, all);
            if (updates.length)
                return resolve({ updates, errors });
            if (errors.length)
                return reject(errors);
        });
    };

    self.getAll = function (filter, sortBy) {
        sortBy = sortBy || "";
        var filtered = Object.values(getAll(entityName)).filter(mongoFilterToFn(filter));
        var dir = /(^|\s)DESC($|\s)/i.test(sortBy)? -1: 1;        

        var sortByFxns = sortBy.split(/[^\w\s]/).filter(s => !!s).map(sort =>{
            var parts = sort.split(" ");
            return (u => u[parts[0]]);
        });

        var sorted = filtered;
        if(sortByFxns.length){
            if(dir == -1)
                sorted = sorted.orderByDescending(sortByFxns);
            else
                sorted = sorted.orderBy(sortByFxns);
        }

        return sorted;
    };

    self.getOne = function(filter, sortBy){
        return (self.getAll(filter, sortBy) || [])[0];
    };

    self.get = function (id) {
        if (id == undefined)
            return self.getAll();

        return getAll(entityName)[id];
    };
}

LocalStorage.getInstance = (e => new LocalStorage(e));
module.exports = LocalStorage;