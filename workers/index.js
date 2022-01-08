require('daemon').daemon(null, [], { cwd: __dirname });

var async = require('async');
var fs = require('fs');
var keystone = require('../app-init');
var AppWorker = keystone.list('AppWorker');
var isFirstPass = true;

function loadWorkers(next) {
	if (isFirstPass)
		console.log("Loading AppWorkers from:", __dirname);

	fs.readdir(__dirname + "/../locks", (err, files) => {
		if(files && files.length)
			files.filter(f => f.endsWith('.lock')).forEach(f => {
				if (fs.existsSync(__dirname + "/../locks/" + f))
					fs.unlink(__dirname + "/../locks/" + f, () => {});
			});

		fs.readdir(__dirname, (err, files) => {
			if (err)
				return console.warn(err);
		
			var modules = files
				.filter(f => f != 'null' && f.endsWith('.js') && !f.endsWith('index.js'))
				.map(f => {
					var worker = require(__dirname + '/' + f);
					worker.name = f.replace(/\.js$/, "");
					worker.lockFile = './locks/' + f.replace(/\.js$/, ".lock");
					return worker;
				});
				
			var filter = { name: { "$in": modules.map(m => m.name) }};			
			if (isFirstPass)
				console.log("Loaded AppWorkers:\n " + filter.name.$in.join(', '));

			AppWorker.model
				.find(filter)
				.exec((err, workers) => {
					if (err)
						console.error(err);

					modules = modules.map(m => {
						var worker = workers.find(w => m.name == w.name);
						
						if (!worker) {
							m.runInterval = 60 * 60 * 1000;
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

function start() {
	if(process.env.ENABLE_BACKGROUNDWORKER <= 0) 
		return console.log("env.ENABLE_BACKGROUNDWORKER flag set to: " + process.env.ENABLE_BACKGROUNDWORKER);
		
		console.log("Starting workers for background processes..");			
		// Load workers
		loadWorkers(function makePass(err, workers) {
			if (err)
				return console.warn(err);
      
      		if (workers) {
				var activeWorkers = workers.filter(m => m.worker.isActive && m.worker.nextRun <= new Date().getTime());
			
				if (isFirstPass)
					console.log("Loaded " + workers.filter(m => m.worker.isActive).length + "/" + workers.length + " active workers..");

				isFirstPass = false;
				if (activeWorkers.length)
					async.each(activeWorkers, m => {
						if (m && m.run) {
							if(process.env.NODE_ENV != "production")
								console.log(`Running worker: '${m.name}'`);

							var saveWorker = (() => {
								m.worker.lastRun = new Date();
								return m.worker.save();
							});
							var run = m.run();
							
							if(run instanceof Promise)
								run.then(saveWorker);
							else
								setTimeout(saveWorker, 100);							
						} else {
							console.error(`Worker: '${m.name}' not properly configured!`);
						}
					});

				//Make next pass after a short delay
				setTimeout(() => loadWorkers(makePass), process.env.WORK_DELAY || 5000);
			} else {
				console.log("No workers found. Exiting workes..");
			}
		});
}

module.exports = { start: start };
