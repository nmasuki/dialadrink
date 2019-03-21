 require('daemon').daemon(null, [], {
   cwd: __dirname
 });
 var async = require('async');
 var fs = require('fs');

 function loadWorkers(next) {
   console.log("Loading: ", __dirname);

   fs.readdir(__dirname + "/../locks", (err, files) => {
     if (err)
       return console.warn(err);

     files.filter(f => f.endsWith('.lock'))
       .forEach(f => fs.unlink(__dirname + "/../locks/" + f));

     fs.readdir(__dirname, (err, files) => {
       var modules = files
         .filter(f => f.endsWith('.js') && !f.endsWith('index.js'))
         .map(f => {
           var worker = require(__dirname + '/' + f);
           worker.name = f.replace(/\.js$/, "");
           worker.lockFile = __dirname + '/../locks/' + f.replace(/\.js$/, ".lock");
           return worker;
         });

       next(null, modules);
     });
   });
 }

 if (process.env.ENABLE_BACKGROUNDWORKER) {
   var passes = 0;
   console.log("Loading workers for background processes..");

   // Load workers
   loadWorkers(function (err, workers) {
     if (err)
       console.warn(err);
     else if (workers) {
       console.log("Loaded " + workers.length + " workers..");

       (function makePass() {
         console.log("Running pass " + (++passes) + "..");

         async.each(workers, worker => {
           if (worker && worker.run) worker.run();
         });

         //Make next pass after a short delay
         setTimeout(makePass, process.env.WORK_DELAY || 60000);
       })();

     } else {
       console.log("No workers found. Exiting..");
     }
   });

 }