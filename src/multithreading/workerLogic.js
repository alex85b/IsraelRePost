const { parentPort, workerData } = require('worker_threads');
const {
	processBranch,
} = require('../js-build/typescript/scrape/ProcessBranch');

const runWorker = async () => {
	// parentPort?.postMessage('[Worker] - before');
	console.log('[Worker] - before');
	const branch = workerData;
	const result = await processBranch(branch);
	parentPort?.postMessage(result);
	console.log('[Worker] - after');
	// parentPort?.postMessage('[Worker] - after');
};

// // Asynchronous function to perform the task
// function performTaskAsync(branch) {
// 	return new Promise((resolve, reject) => {
// 		try {
// 			resolve();
// resolve(branch);
// Simulating an asynchronous operation
// setTimeout(() => {
// 	// Check for success or failure conditions
// 	const isSuccess = Math.random() < 0.5;
// 	if (isSuccess) {
// 		resolve('Task completed successfully for ', branch);
// 	} else {
// 		reject(new Error({ message: 'Task failed', source: branch }));
// 	}
// }, 2000);
// 		} catch (error) {
// 			reject(new Error(branch));
// 		}
// 		return;
// 	});
// }

runWorker();
