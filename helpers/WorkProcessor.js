var lockFile = require('lockfile');

function WorkProcessor(getWork, doWork) {
    var self = this;

    self.run = function () {
        return new Promise((resolve, reject) => {  
            var processWork = function() {
                var gwPromise = getWork(function () {
                    var promise = doWork.apply(this, arguments);
                    if (!promise || (promise.costructor && promise.costructor.name != 'Promise'))
                        promise = Promise.resolve(promise || 0);
                    
                    return promise.finally(() => {
                        if(self.lockFile) lockFile.unlock(self.lockFile);
                        resolve(promise);
                    });
                });

                if(gwPromise instanceof Promise)
                    gwPromise.then(() => console.log(`GetWork on ${self.name}..`));
            };
            
            if (!self.lockFile)
                processWork();
            else
                lockFile.lock(self.lockFile, function (err) {
                    if (err) return;

                    processWork();
                });
        });
    };
}

module.exports = WorkProcessor;