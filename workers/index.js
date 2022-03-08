var keystone = require('keystone');
var AppWorker = keystone.list('AppWorker');
var fs = require('fs');
var isFirstPass = true;

function readdir(directory) {
	return new Promise((resolve, reject) => {
		fs.readdir(directory, (err, files) => {
			if (err)
				return reject(err);

			resolve(files.map(f => directory + '/' + f));
		});
	});
}

function unlink(file) {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(file)) return resolve(null);
		fs.unlink(file, (err, data) => {
			if (err)
				return reject(err);

			resolve(data);
		});
	});
}



async function loadWorkers() {
	if (isFirstPass)
		console.log("Loading AppWorkers from:", __dirname);

	var jsFiles = (await readdir(__dirname)).filter(f => f && f != 'null' && f.endsWith('.js') && !f.endsWith('index.js'));
	var modules = jsFiles.map(f => {
		var jsPath = [f, __dirname + '/' + f].find(fs.existsSync);
		if (jsPath) {
			var worker = require(jsPath);
			worker.name = f.replace(/\.js$/, "").split('/').last();
			worker.lockFile = `${__dirname}/../locks/${worker.name}.lock`;
			if (!fs.existsSync(worker.lockFile))
				return worker;
		}
	}).filter(m => m);

	if (isFirstPass)
		console.log("Loaded AppWorkers:\n" + modules.map(m => m.name).join(', '));

	var filter = { name: { "$in": modules.map(m => m.name) } };
	var workers = await AppWorker.model.find(filter).exec();

	modules = modules.map(m => {
		var worker = workers.find(w => m.name == w.name);

		if (!worker) {
			console.log(`Initializing ${m.name}..`);
			m.runInterval = 60 * 60 * 1000;
			worker = new AppWorker.model(m);
			worker.isActive = true;
			worker.save();
		}

		m.worker = worker;
		return m;
	});

	return modules;
}

async function start(delay) {
	if (process.env.ENABLE_BACKGROUNDWORKER <= 0)
		return console.log("env.ENABLE_BACKGROUNDWORKER flag set to: " + process.env.ENABLE_BACKGROUNDWORKER);

	console.log("Starting workers for background processes..");
	var lockFiles = (await readdir(__dirname + "/../locks")).filter(f => f.endsWith('.lock'));
	for (var f of lockFiles) await unlink(f)

	async function makePass() {
		// Load workers
		var workers = await loadWorkers();
		if (workers) {
			var activeWorkers = workers.filter(m => m.worker.isActive && m.worker.nextRun <= new Date().getTime());

			if (isFirstPass)
				console.log("Loaded " + workers.filter(m => m.worker.isActive).length + "/" + workers.length + " active workers..");

			isFirstPass = false;
			if (activeWorkers.length) {
				var i = 0;

				async function runNextWorker() {
					var m = activeWorkers[i++];
					if (m) {
						if (typeof m.run == "function") {
							if (process.env.NODE_ENV != "production")
								console.log(`Starting run on worker: '${m.name}'...`);

							var saveWorker = (async () => {
								m.worker.lastRun = new Date();
								return await m.worker.save();
							});

							var run = m.run();
							if (run instanceof Promise)
								await run.then(saveWorker);
							else
								await saveWorker();

							if (process.env.NODE_ENV != "production")
								console.log(`Finished run on worker: '${m.name}'...`);
						} else {
							console.error(`Worker: '${m.name}' not properly configured!`);
						}


						return Promise.delay(process.env.WORK_DELAY || 5000).then(runNextWorker);
					}
				};

				runNextWorker().then(() => console.log("Done! Awaiting next iteration."));
			}
		} else {
			console.log("No workers found. Exiting workes..");
		}

		//Make next pass after a short delay
		return await await Promise.delay(process.env.WORK_DELAY || 5000).then(makePass);

	}

	return await await Promise.delay(delay || 0).then(makePass);
}

module.exports = { start: start };
