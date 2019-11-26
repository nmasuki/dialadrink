var lockFile = require('lockfile');

function WorkProcessor(getWork, doWork) {
    var self = this;

    self.run = function () {
        if (!self.lockFile)
            getWork(doWork);
        else
            lockFile.lock(self.lockFile, function (err) {
                if (err)
                    return console.warn("Could not aquire lock.", self.lockFile, err);

                getWork(function () {
                    var promise = doWork.apply(this, arguments);

                    if (!promise || (promise.costructor && promise.costructor.name != 'Promise'))
                        promise = Promise.resolve(promise || 0);
                    
                    promise.finally(() => lockFile.unlock(self.lockFile));
                });
            });
    };
}

module.exports = WorkProcessor;