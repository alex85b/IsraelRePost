// import { Worker } from 'worker_threads';
// import { Mutex } from 'async-mutex';
// import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
// import { splitBranchesArray } from '../common/SplitBranchesArray';
// import { IWorkerRerun } from './Worker';

// export interface IProxyAuthObject {
// 	proxyAuth: {
// 		password: string;
// 		username: string;
// 	};
// 	proxyUrl: string;
// 	useProxy: boolean;
// }

// export interface IWorkerData {
// 	id: number;
// 	branches: ISingleBranchQueryResponse[];
// 	proxyConfig: IProxyAuthObject;
// }

// export class ManageThreads {
// 	// private workerScriptPath: string;
// 	// private requestsLimit = 48;
// 	// private requestsTimeout = 61000;
// 	// private threadAmount = 2;
// 	private requestsCounter = 0;
// 	private isDelayed = false;
// 	private sharedDelay: Promise<void> | null = null;
// 	private mutex = new Mutex();
// 	private workers: Worker[] = [];
// 	private promises: Promise<void>[] = [];
// 	private rerunBranches: ISingleBranchQueryResponse[] = [];

// 	constructor(
// 		private workerScriptPath: string,
// 		private requestsLimit = 48,
// 		private requestsTimeout = 61000,
// 		private threadAmount = 2,
// 		private branchesBatch: ISingleBranchQueryResponse[] = [],
// 		private proxyConfig: IProxyAuthObject
// 	) {}

// 	performBranchScrape(
// 		rerun: boolean = false
// 	): Promise<PromiseSettledResult<void>[]> {
// 		let branchesPerWorker: any;
// 		if (rerun) {
// 			branchesPerWorker = this.splitWorkloadPerWorker(this.rerunBranches);
// 		} else {
// 			branchesPerWorker = this.splitWorkloadPerWorker(this.branchesBatch);
// 		}

// 		for (let index = 1; index <= this.threadAmount; index++) {
// 			const branches = branchesPerWorker[index - 1];
// 			const data: IWorkerData = {
// 				id: index,
// 				branches: branches,
// 				proxyConfig: this.proxyConfig,
// 			};
// 			const newWorker = new Worker(this.workerScriptPath, {
// 				workerData: data,
// 			});

// 			const workerPromise = new Promise<void>((resolve, reject) => {
// 				newWorker.on('message', async (message) => {
// 					if (message.type && message.type === 'req') {
// 						const req = message;
// 						console.log(
// 							`Worker ${req.id} asked for permission to perform request, counter is ${this.requestsCounter}`
// 						);
// 						await this.mutex.runExclusive(async () => {
// 							if (this.requestsCounter < this.requestsLimit) {
// 								await this.incrementCounter(message.id || -1);
// 								newWorker.postMessage({ type: 'ack' });
// 							} else {
// 								if (this.isDelayed && this.sharedDelay) {
// 									await this.sharedDelay;
// 								} else {
// 									this.sharedDelay = new Promise((resolve) => {
// 										setTimeout(() => {
// 											this.requestsCounter = 0;
// 											resolve();
// 										}, this.requestsTimeout);
// 									});
// 									await this.sharedDelay;
// 									this.sharedDelay = null;
// 								}
// 								await this.incrementCounter(message.id || -1);
// 								newWorker.postMessage({ type: 'ack' });
// 							}
// 						});
// 					}
// 					// if (message.type && message.type === 'rerun') {
// 					// 	const rerunMessage: IWorkerRerun = message;
// 					// 	const { data, id, type } = rerunMessage;
// 					// 	const { amount, branches } = data;
// 					// 	while (branches.length > 0) {
// 					// 		const failedBranch = branches.pop();
// 					// 		if (failedBranch) {
// 					// 			this.rerunBranches.push(failedBranch);
// 					// 		}
// 					// 	}
// 					// 	reject();
// 					// }
// 				});
// 				newWorker.once('online', () => {
// 					newWorker.postMessage({ type: 'run' });
// 				});
// 				newWorker.once('error', (error) => {
// 					console.log(`Noticed worker ${index} error: `, error);
// 					reject();
// 				});
// 				newWorker.once('exit', (exitCode) => {
// 					console.log(`Noticed worker ${index} exit: `, exitCode);
// 					if (exitCode === 0) resolve();
// 					reject();
// 				});
// 			});

// 			this.workers.push(newWorker);
// 			this.promises.push(workerPromise);
// 		}

// 		return Promise.allSettled(this.promises);
// 	}

// 	cleanKilWorkers(): Promise<PromiseSettledResult<any>[]> {
// 		const workerExitStatus: any = [];
// 		for (let index = 0; index < this.workers.length; index++) {
// 			workerExitStatus.push(this.workers[index].terminate());
// 		}

// 		return Promise.all(workerExitStatus);
// 	}

// 	private async incrementCounter(id: number) {
// 		this.requestsCounter++;
// 		// console.log(`Counter: ${this.requestsCounter} Worker: ${id}`);
// 	}

// 	getFailedBranches() {
// 		// return this.rerunBranches;
// 		JSON.parse(JSON.stringify(this.rerunBranches));
// 	}

// 	resetFailedBranches() {
// 		this.rerunBranches = [];
// 	}

// 	getFailedBranchesAmount() {
// 		return this.rerunBranches.length;
// 	}

// 	async rerunFailedBranches() {
// 		console.log(
// 			'[ManageThreads] [rerunFailedBranches] before rerun :',
// 			this.rerunBranches.length
// 		);
// 		if (this.rerunBranches) {
// 			await this.cleanKilWorkers();
// 			await this.performBranchScrape(true);
// 		}
// 		console.log(
// 			'[ManageThreads] [rerunFailedBranches] after rerun :',
// 			this.rerunBranches.length
// 		);
// 	}

// 	private splitWorkloadPerWorker(splitBranches: ISingleBranchQueryResponse[]) {
// 		let requiredChunksSize = Math.ceil(splitBranches.length / this.threadAmount);
// 		return splitBranchesArray(splitBranches, requiredChunksSize);
// 	}
// }
