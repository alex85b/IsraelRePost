// This is a multithreading test.
// This should handle different worker threads, and attach 3 listeners to each new thread.

const { Worker, workerData, parentPort } = require('worker_threads');
const { NotProvided } = require('../js-build/typescript/errors/NotProvided');
// const {
// 	processBranch,
// } = require('../js-build/typescript/scrape/ProcessBranch');
const path = require('path');

const handleWorkerThreads = (
	branches,
	useProxy,
	endpointUrl,
	endpointUsername,
	endpointPassword
) => {
	const processBranchPath = path.join(
		__dirname,
		'..',
		'js-build',
		'typescript',
		'scrape',
		'ProcessBranch.js'
	);

	const proxyUrl = endpointUrl || 'http://gate.smartproxy.com:7000'; // Replace with your actual proxy URL
	const proxyAuth = {
		username: endpointUsername || 'spqejf32bn', // Replace with your actual username
		password: endpointPassword || 'kcin1BkcpNIHul110t', // Replace with your actual password
	};

	const promises = [];
	for (const branch of branches) {
		//
		// Iterate each branch.
		const promise = new Promise((resolve, reject) => {
			//
			// Pass a branch to a workerInstance, then encapsulate it inside a promise.
			const workerInstance = createWorkerInstance(
				processBranchPath,
				branch,
				useProxy,
				proxyUrl,
				proxyAuth
			);

			workerInstance.on('message', (result) => {
				console.log('Received result from worker');
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

const createWorkerInstance = (
	workerScriptPath,
	branch,
	useProxy,
	proxyUrl,
	proxyAuth
) => {
	console.log(workerScriptPath);
	return new Worker(workerScriptPath, {
		workerData: { branch, useProxy, proxyUrl, proxyAuth },
	});
};

module.exports = { handleWorkerThreads };
