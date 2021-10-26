var lockFile = require('lockfile');

function WorkProcessor(getWork, doWork) {
    var self = this;

    self.run = function () {
        return new Promise((resolve, reject) => {  
            var processWork = function() {
                return getWork(function () {
                    var promise = doWork.apply(this, arguments);
                    if (!promise || (promise.costructor && promise.costructor.name != 'Promise'))
                        promise = Promise.resolve(promise || 0);
                    
                    promise.finally(() => {
                        if(self.lockFile) lockFile.unlock(self.lockFile);
                        resolve(promise);
                    });
                });
            };
            
            if (!self.lockFile)
                processWork();
            else
                lockFile.lock(self.lockFile, function (err) {
                    if (err)
                        return console.error("Could not aquire lock.", self.lockFile, err);

                    processWork();
                });
        });
    };
}

module.exports = WorkProcessor;