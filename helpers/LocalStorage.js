var fs = require('fs');
var path = require('path');
var lockFile = require('lockfile');
var dataDir = path.resolve("../data/");

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

function tryDateParse(str){
    try {
        return new Date(str).toISOString();
    }catch(e){
        return undefined;
    }
}

function tryParse(str){
    if(!str) return null;

    try{
        return JSON.parse(str);
    }catch(e){
        console.error("Error parsing json.", str, e);
        return null;
    }
}

function toFilterFn(filter){
    if(typeof filter == "string"){
        var regex = new RegExp("(" + filter.escapeRegExp() + ")", "ig");
        return (val => !filter || regex.test(JSON.stringify(val)));
    }
           
    return function(val){
        if(!filter) return true;

        var matched = true;
		
        for(var i in filter){
			if(!matched) return matched;
				
			var parts = i.split(".");
			
			if(parts.length > 1){
				for(var j = 0; j < parts.length - 1; j++){
					if(filter.hasOwnProperty(p)){
						filter = filter[p];
						i = i.substr(i.indexOf("."));
					}
				}
			}

			if(filter.hasOwnProperty(i)){
				switch(i){
					case "$not":
						matched = matched && !toFilterFn(filter[i])(val);
						break;
					case "$or":
						if(!Array.isArray(filter[i]))
						   throw "Expecting an array at " + i;
						
						matched = matched &&  Array.from(filter[i]).some(f => toFilterFn(f)(val));
						break;
					case "$and":
						if(!Array.isArray(filter[i]))
							throw "Expecting an array at " + i;
						
						matched = matched &&  Array.from(filter[i]).every(f => toFilterFn(f)(val));
						break;
					case "$elemMatch":
						if(!val || !Array.isArray(val))
							throw `Expecting an array at '${i}' to evaluate!`;
						
						matched = matched && Array.from(val).some(v => toFilterFn(filter[i])(v));
						break;
					case "$in":
						if(!Array.isArray(filter[i]))
							throw `Expecting an array at '${i}' to evaluate!`;
						
						matched = matched && Array.from(filter[i]).some(f => toFilterFn(f)(val));
						break;
					case "$gt":
						matched = matched && val > filter[i];
						break;
					case "$gte":
						matched = matched && val >= filter[i];
						break;
					case "$lt":
						matched = matched && val < filter[i];
						break;
					case "$lte":
						matched = matched && val <= filter[i];
						break;
					case "$ne":
						if(filter[i] instanceof RegExp)
							matched = matched && !filter[i].test(val);
						else
							matched = matched && val != filter[i];
						break;
					case "$eq":
						if(filter[i] instanceof RegExp)
							matched = matched && filter[i].test(val);
						else
							matched = matched && val == filter[i];
						break;
					default:
						if(filter[i] instanceof RegExp)
							matched = matched && val && filter[i].test(val[i]);
						else
							matched = matched && val && val[i] == filter[i];
				}
			}           
        }
        
        return matched;
    };
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

            all = tryParse(jsonStr.substr(startIndex)) || {};
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
                        if (all[i].hasOwnProperty(j) && /^date|date$/i.test(j.toString()))
                            all[i][j] = tryDateParse(all[i][j]); 
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
        console.log("Aquiring lock ", path.resolve(dataDir, entityName + ".lock"));
        lockFile.lock(path.resolve(dataDir, entityName + ".lock"), function (err) {
            if (err){
                console.warn("Could not aquire lock.", err);
                setTimeout(function(){ 
                    console.log("Retrying save..");
                    saveAll(entityName, all).then(resolve).catch(reject); 
                }, 100);
            }

            console.log("Saving to file.", path.resolve(dataDir, entityName + ".json"));
            fs.writeFile(path.resolve(dataDir, entityName + ".json"), JSON.stringify(all, null, 2), function (err) {
                console.log("Saved to file.", path.resolve(dataDir, entityName + ".json"), "releasing lock", path.resolve(dataDir, entityName + ".lock"));
                lockFile.unlock(path.resolve(dataDir, entityName + ".lock"));

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
        var all = getAll(entityName),
            updates = [],
            errors = [];

        function setEntiry(entity) {
            var id = entity._id || entity.id || entity.Id || entity.public_id || (entity._id = entityName.toLowerCase() + "-" + uuidv4());
            entity._rev = entity._rev || entity.__v;
            
            var curRev = parseInt((all[id] && all[id]._rev || "0").toString().split('-')[0]);
            var docRev = parseFloat((entity._rev || "0").toString().split('-')[0]);

            if(!entity._rev || curRev == docRev)
                entity._rev = parseInt(1 + curRev) + "-" + uuidv4();
            else if(docRev > curRev){
                if(Math.abs(docRev - curRev) < 1)
                    entity._rev = parseInt(1 + docRev) + "-" + uuidv4();
                else
                    entity._rev = parseInt(docRev) + "-" + uuidv4();                    
            } else if (all[id] && all[id]._rev && entity._rev && curRev > docRev) {
                var msg = ["Document conflict! ", id, all[id]._rev, entity._rev].join(",");
                errors.push({ _id: id, _rev: all[id]._rev, error: msg });
                return console.error(msg);
            }
            
            if (entity.__v) delete entity.__v;       
            
            if(all[id])
                console.log("Updating " + entityName + "..\n\t _id:" + id + "\n\t_rev:" +all[id]._rev + " ---> " + entity._rev);

            all[id] = all[id] || { _id: id, _rev: curRev, createdDate: new Date() };
            all[id].modifiedDate = new Date();
            
            var userId = global.appUser && global.appUser._id || null;
            if(all[id].createdBy && all[id].createdBy._id)
                all[id].createdBy = all[id].createdBy._id;
            
            all[id].createdBy = all[id].createdBy || userId;
            all[id].lastModifiedBy = userId;

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
                return resolve({ updates, errors });
            if (errors.length)
                return reject(errors);
        });
    };

    self.getAll = function (filter, sortBy) {
        sortBy = sortBy || "";
        var filtered = Object.values(getAll(entityName)).filter(toFilterFn(filter));
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
        var all = self.getAll(filter, sortBy) || [];
        return all[0];
    };


    self.get = function (id) {
        if (id == undefined)
            return self.getAll();

        var all = getAll(entityName);
        return all[id];
    };
}

LocalStorage.getInstance = (e => new LocalStorage(e));

module.exports = LocalStorage;

