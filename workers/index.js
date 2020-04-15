require('daemon').daemon(null, [], {
  cwd: __dirname
});

var async = require('async');
var fs = require('fs');
var keystone = require('keystone');
var AppWorker = keystone.list('AppWorker');
var isFirstPass = true;

function loadWorkers(next) {
  if (isFirstPass)
    console.log("Loading: ", __dirname);

  fs.readdir(__dirname + "/../locks", (err, files) => {
    if (err)
      return console.warn(err);

    files.filter(f => f.endsWith('.lock'))
      .forEach(f =>{
        if (fs.existsSync(__dirname + "/../locks/" + f)) 
          fs.unlink(__dirname + "/../locks/" + f);
      });

    fs.readdir(__dirname, (err, files) => {
      var modules = files
        .filter(f => f.endsWith('.js') && !f.endsWith('index.js'))
        .map(f => {
          var worker = require(__dirname + '/' + f);
          worker.name = f.replace(/\.js$/, "");
          worker.lockFile = './locks/' + f.replace(/\.js$/, ".lock");
          return worker;
        });

      AppWorker.model
        .find({
          name: {
            "$in": modules.map(m => m.name)
          }
        })
        .exec((err, workers) => {
          if (err)
            console.error(err);

          modules = modules.map(m => {
            var worker = workers.find(w => m.name == w.name);

            if (!worker) {
              m.runInterval = 60 * 1000;
              worker = new AppWorker.model(m);
              worker.isActive = true;
              worker.save();
            }

            m.worker = worker;
            return m;
          });

          next(null, modules);
        });

    });
  });
}

if (process.env.ENABLE_BACKGROUNDWORKER >= 0) {
  console.log("Loading workers for background processes..");
  // Load workers
  loadWorkers(function makePass(err, workers) {
    if (err)
      console.warn(err);

    else if (workers) {
      if (isFirstPass)
        console.log("Loaded " + workers.filter(m => m.worker.isActive).length + " workers..");

      isFirstPass = false;

      var activeWorkers = workers.filter(m => {
        var active = m.worker.isActive && m.worker.nextRun <= new Date().getTime();
        return active;
      });

      if (activeWorkers.length)
        async.each(activeWorkers, m => {
          if (m && m.run) {
            console.log(`Running worker: '${m.name}'`);

            m.run();
            m.worker.lastRun = new Date();
            m.worker.save();
          } else {
            console.error(`worker: '${m.name}' not properly configured!`);
          }
        });

      //Make next pass after a short delay
      setTimeout(() => loadWorkers(makePass), process.env.WORK_DELAY || 60000);
      
    } else {
      console.log("No workers found. Exiting workes..");
    }
  });
}