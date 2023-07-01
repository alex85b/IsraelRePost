// This is a multithreading test.
// This should handle different worker threads, and attach 3 listeners to each new thread.

const { Worker, workerData, parentPort } = require('worker_threads');

const handleWorkerThreads = (branches) => {
	const promises = [];
	for (const branch of branches) {
		//
		// Iterate each branch.
		const promise = new Promise((resolve, reject) => {
			//
			// Pass a branch to a workerInstance, then encapsulate it inside a promise.
			const workerInstance = createWorkerInstance(
				'./src/multithreading/workerLogic.js',
				branch
			);

			workerInstance.on('message', (result) => {
				console.log('Received result from worker:', result);
				resolve(result);
			});

			workerInstance.on('error', (error) => {
				console.error('Worker error:', error);
				reject(error);
			});

			workerInstance.on('exit', (code) => {
				console.log('Worker exited with code:', code);
			});
		});

		promises.push(promise);
	}
	return Promise.all(promises);
};

const createWorkerInstance = (workerScriptPath, branch) => {
	return new Worker(workerScriptPath, { workerData: { branch } });
};

module.exports = { handleWorkerThreads };
