var keystone = require('keystone');
var AppWorker = keystone.list('AppWorker');
var fs = require('fs');
var isFirstPass = true;

function readdir(directory) {
	return new Promise((resolve, reject) => {
		fs.readdir(directory, (err, files) => {
			if(err)
				return reject(err);

			resolve(files);
		});
	});
}

async function loadWorkers() {
	if (isFirstPass)
		console.log("Loading AppWorkers from:", __dirname);

	var lockFiles = (await readdir(__dirname + "/../locks")).filter(f => f.endsWith('.lock'));
	var jsFiles = (await readdir(__dirname)).filter(f => f && f != 'null' && f.endsWith('.js') && !f.endsWith('index.js'));

	if (lockFiles && lockFiles.length)
		lockFiles.forEach(f => {
			if (fs.existsSync(__dirname + "/../locks/" + f))
				fs.unlink(__dirname + "/../" + f, () => { });
		});

	var modules = jsFiles.map(f => {
		var worker = require(__dirname + '/' + f);
		worker.name = f.replace(/\.js$/, "");
		worker.lockFile = './locks/' + f.replace(/\.js$/, ".lock");
		return worker;
	});

	if (isFirstPass)
		console.log("Loaded AppWorkers:\n" + modules.map(m => m.name).join(', '));

	var filter = { name: { "$in": modules.map(m => m.name) }};			
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

	async function makePass() {
		// Load workers
		var workers = await loadWorkers();
		if (workers) {
			var activeWorkers = workers.filter(m => m.worker.isActive && m.worker.nextRun <= new Date().getTime());

			if (isFirstPass)
				console.log("Loaded " + workers.filter(m => m.worker.isActive).length + "/" + workers.length + " active workers..");

			isFirstPass = false;
			if (activeWorkers.length) {
				activeWorkers.forEach(async m => {
					if (m && m.run) {
						if (process.env.NODE_ENV != "production")
							console.log(`Running worker: '${m.name}'...`);

						var saveWorker = (async () => {
							m.worker.lastRun = new Date();
							return await m.worker.save();
						});

						var run = m.run();

						if (run instanceof Promise)
							await run.then(saveWorker);
						else
							await saveWorker();
					} else {
						console.error(`Worker: '${m.name}' not properly configured!`);
					}
				})
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
