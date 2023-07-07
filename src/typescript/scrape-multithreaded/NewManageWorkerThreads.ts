// This is a multithreading test.
// This should handle different worker threads, and attach 3 listeners to each new thread.

import { Worker, workerData, parentPort } from 'worker_threads';
import path from 'path';
import { IBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { CustomError } from '../errors/custom-error';
import { AxiosError } from 'axios';

export interface ManageWorkerThreads {
	branches: IBranchQueryResponse;
	useProxy: boolean;
	endpointUrl: string;
	endpointUsername: string;
	endpointPassword: string;
	portRangeStart: number;
	portRangeEnd: number;
	timeout: number;
}

interface WorkerOutput {
	status: number;
	branchname: string | null;
	branchId: number | null;
	branch: IBranchQueryResponse | null;
	error: Error | null;
}

export const manageWorkerThreads = (data: ManageWorkerThreads) => {
	//
	// Resolve path to the worker script.
	const processBranchPath = path.join(
		__dirname,
		'..',
		// 'js-build',
		'scrape-multithreaded',
		'ProcessBranch.js'
	);

	// Destructure incoming data.
	const {
		branches,
		endpointPassword,
		endpointUrl,
		endpointUsername,
		portRangeEnd,
		portRangeStart,
		timeout,
		useProxy,
	} = data;

	// Representation of worker answer or failure.
	const branchScrapePromises: Promise<WorkerOutput>[] = [];

	// Amount of endpoints.
	let EndpointsAmount = portRangeEnd - portRangeStart + 1;
	let currentPort = portRangeStart;

	if (useProxy) {
		// Iterate endpoints.
		while (EndpointsAmount > 0) {
			EndpointsAmount = EndpointsAmount - 1;
			console.log(endpointUrl + currentPort);

			const proxyUrl = endpointUrl + currentPort;
			const proxyAuth = {
				username: endpointUsername,
				password: endpointPassword,
			};

			// Iterate Branches per endpoint.
			let branchCounter = 10;
			while (branchCounter > 0 && branches.length > 0) {
				branchCounter = branchCounter - 1;
				const branch = branches.pop();
				if (!branch) break;
				const promise: Promise<WorkerOutput> = new Promise((resolve, reject) => {
					//
					// Encapsulate a thread within a promise.
					const workerInstance = new Worker(processBranchPath, {
						workerData: { branch, useProxy, proxyUrl, proxyAuth, timeout },
					});

					// Resolve promise on message from thread.
					workerInstance.on('message', (result) => {
						workerInstance.terminate();
						resolve({
							status: 1,
							branchname: branch._source.branchnameEN,
							branchId: branch._source.branchnumber,
							branch: null,
							error: null,
						});
					});

					// Reject promise on Error in thread.

					//! Ignore exit, if handled incorrectly will cause infinite wait.
				});
				console.log(branchCounter, branch);
			}

			currentPort = currentPort + 1;
		}

		// Possibly a helper function
		const threadPromise = (resolve: PromiseLike<WorkerOutput>, reject: any) => {};
	}

	// Each 10 'Branches' get an 'Endpoint'.
	// Each Endpoint does 10 scrapes on 10 'Branches'.

	// 	const promises: Promise<WorkerOutput>[] = [];
	// 	for (const branch of data.branches) {
	// 		//
	// 		// Iterate each branch.
	// 		const promise: Promise<WorkerOutput> = new Promise((resolve, reject) => {
	// 			//
	// 			// Pass a branch to a workerInstance, then encapsulate it inside a promise.
	// 			const workerInstance = new Worker(processBranchPath, {
	// 				workerData: { branch, useProxy, proxyUrl, proxyAuth, timeout },
	// 			});

	// 			workerInstance.on('message', (result) => {
	// 				// console.log(
	// 				// 	`[handleWorkerThreads] [Result] Received result from ${branch._source.branchnameEN}`
	// 				// );
	// 				workerInstance.terminate();
	// 				resolve({
	// 					status: 1,
	// 					branchname: branch._source.branchnameEN,
	// 					branchId: branch._source.branchnumber,
	// 					branch: null,
	// 					error: null,
	// 				});
	// 			});

	// 			workerInstance.on('error', (error) => {
	// 				console.error(
	// 					`[handleWorkerThreads] ${branch._source.branchnameEN} error:`
	// 				);

	// 				if (error instanceof CustomError) {
	// 					console.error(
	// 						'[handleWorkerThreads] [CustomError] message: ',
	// 						(error as CustomError).serializeErrors()
	// 					);
	// 				} else if (error instanceof AxiosError) {
	// 					console.error(
	// 						'[handleWorkerThreads] [AxiosError] Keys: ',
	// 						Object.keys(error as AxiosError)
	// 					);
	// 					console.log(error);
	// 				} else {
	// 					console.error(`[handleWorkerThreads] [unknown Error]`);
	// 					console.log(error);
	// 				}

	// 				workerInstance.terminate();
	// 				reject({
	// 					status: 0,
	// 					branchname: null,
	// 					branchId: null,
	// 					branch: branch,
	// 					error: error,
	// 				});
	// 			});

	// 			workerInstance.on('exit', (code) => {
	// 				// console.log(
	// 				// 	`[handleWorkerThreads] [Exit] ${branch._source.branchnameEN} exited with code:`,
	// 				// 	code
	// 				// );
	// 			});
	// 		});

	// 		promises.push(promise);
	// 	}
	// 	return Promise.allSettled(promises);
	// 	// all(promises);
};
