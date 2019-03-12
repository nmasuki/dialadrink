require('daemon').daemon(null, [], {
  cwd: __dirname
});
var async = require('async');
var fs = require('fs');

var passes = 0;
console.log("Loading workers for background processes..");

// Load workers
loadWorkers(function (err, workers) {
  if (err)
    console.error(err);
  else if (workers) {
    console.log("Loaded " + workers.length + " workers..");
    (function makePass() {
      console.log("Running pass " + (++passes) + "..");
      
      async.each(workers, worker => {
        if (worker && worker.run)
          worker.run();
      });

      //Make next pass after a short delay
      setTimeout(makePass, process.env.WORK_DELAY || 60000);
    })();
  } else {
    console.log("No workers found. Exiting..");
  }
});

function loadWorkers(next) {
  console.log("Loading: ", __dirname);
  var files = fs.readdirSync(__dirname)
    .filter(f => !f.endsWith('index.js'));
  var modules = files.map(f => require(__dirname + '/' + f));
  next(null, modules);
}