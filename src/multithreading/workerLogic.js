// const { parentPort, workerData } = require('worker_threads');
// const {
// 	processBranch,
// } = require('../js-build/typescript/scrape/ProcessBranch');
// const { log } = require('console');

// const runWorker = async () => {
// 	console.log('[Worker] - before');
// 	const { branch, useProxy, proxyUrl, proxyAuth } = workerData;
// 	console.log('Worker Data: ', workerData);
// 	console.log('Use Proxy: ', useProxy);
// 	console.log('Proxy Url: ', proxyUrl);
// 	console.log('Proxy Auth: ', proxyAuth);
// 	const result = await processBranch(branch);
// 	parentPort?.postMessage(result);
// 	console.log('[Worker] - after');
// };

// runWorker();
