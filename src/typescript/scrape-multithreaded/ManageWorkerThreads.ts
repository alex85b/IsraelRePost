// This is a multithreading test.
// This should handle different worker threads, and attach 3 listeners to each new thread.

import { Worker, workerData, parentPort } from 'worker_threads';
import path from 'path';
import { IBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { CustomError } from '../errors/custom-error';
import e from 'express';
import { AxiosError } from 'axios';

const handleWorkerThreads = (
	branches: IBranchQueryResponse,
	useProxy: boolean,
	endpointUrl: string,
	endpointUsername: string,
	endpointPassword: string,
	timeout: number
) => {
	const processBranchPath = path.join(
		__dirname,
		'..',
		// 'js-build',
		'scrape-multithreaded',
		'ProcessBranch.js'
	);

	const proxyUrl = endpointUrl || 'http://gate.smartproxy.com:7000'; // Replace with your actual proxy URL
	const proxyAuth = {
		username: endpointUsername || 'spqejf32bn', // Replace with your actual username
		password: endpointPassword || 'kcin1BkcpNIHul110t', // Replace with your actual password
	};

	const promises: Promise<{
		status: number;
		branchname: string | null;
		branchId: number | null;
		branch: IBranchQueryResponse | null;
		error: Error | null;
	}>[] = [];
	for (const branch of branches) {
		//
		// Iterate each branch.
		const promise: Promise<{
			status: number;
			branchname: string | null;
			branchId: number | null;
			branch: IBranchQueryResponse | null;
			error: Error | null;
		}> = new Promise((resolve, reject) => {
			//
			// Pass a branch to a workerInstance, then encapsulate it inside a promise.
			const workerInstance = new Worker(processBranchPath, {
				workerData: { branch, useProxy, proxyUrl, proxyAuth, timeout },
			});

			workerInstance.on('message', (result) => {
				// console.log(
				// 	`[handleWorkerThreads] [Result] Received result from ${branch._source.branchnameEN}`
				// );
				workerInstance.terminate();
				resolve({
					status: 1,
					branchname: branch._source.branchnameEN,
					branchId: branch._source.branchnumber,
					branch: null,
					error: null,
				});
			});

			workerInstance.on('error', (error) => {
				console.error(
					`[handleWorkerThreads] ${branch._source.branchnameEN} error:`
				);

				if (error instanceof CustomError) {
					console.error(
						'[handleWorkerThreads] [CustomError] message: ',
						(error as CustomError).serializeErrors()
					);
				} else if (error instanceof AxiosError) {
					console.error(
						'[handleWorkerThreads] [AxiosError] Keys: ',
						Object.keys(error as AxiosError)
					);
					console.log(error);
				} else {
					console.error(`[handleWorkerThreads] [unknown Error]`);
					console.log(error);
				}

				workerInstance.terminate();
				reject({
					status: 0,
					branchname: null,
					branchId: null,
					branch: branch,
					error: error,
				});
			});

			workerInstance.on('exit', (code) => {
				// console.log(
				// 	`[handleWorkerThreads] [Exit] ${branch._source.branchnameEN} exited with code:`,
				// 	code
				// );
			});
		});

		promises.push(promise);
	}
	return Promise.allSettled(promises);
	// all(promises);
};

module.exports = { handleWorkerThreads };
