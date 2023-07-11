import { Worker } from 'worker_threads';
import { Mutex } from 'async-mutex';
import { ISingleBranchQueryResponse } from '../../interfaces/IBranchQueryResponse';
import { splitBranchesArray } from '../../common/SplitBranchesArray';

export class ManageThreads {
	// private workerScriptPath: string;
	// private requestsLimit = 48;
	// private requestsTimeout = 61000;
	// private threadAmount = 2;
	private requestsCounter = 0;
	private isDelayed = false;
	private sharedDelay: Promise<void> | null = null;
	private mutex = new Mutex();
	private workers: Worker[] = [];
	private promises: Promise<void>[] = [];
	//// private workerPromises = new Map<Worker, Promise<void>>();

	constructor(
		private workerScriptPath: string,
		private requestsLimit = 48,
		private requestsTimeout = 61000,
		private threadAmount = 2,
		private branchesBatch: ISingleBranchQueryResponse[] = []
	) {}

	spawnWorkers(): Promise<PromiseSettledResult<void>[]> {
		const branchesPerWorker = this.splitWorkloadPerWorker();
		for (let index = 1; index <= this.threadAmount; index++) {
			const branches = branchesPerWorker[index - 1];
			const newWorker = new Worker(this.workerScriptPath, {
				workerData: { id: index, branches: branches },
			});

			const workerPromise = new Promise<void>((resolve, reject) => {
				newWorker.on('message', async (message) => {
					if (message.type && message.type === 'req') {
						await this.mutex.runExclusive(async () => {
							if (this.requestsCounter < this.requestsLimit) {
								await this.incrementCounter(message.id || -1);
								newWorker.postMessage({ type: 'ack' });
							} else {
								if (this.isDelayed && this.sharedDelay) {
									await this.sharedDelay;
								} else {
									this.sharedDelay = new Promise((resolve) => {
										setTimeout(() => {
											this.requestsCounter = 0;
											resolve();
										}, this.requestsTimeout);
									});
									await this.sharedDelay;
									this.sharedDelay = null;
								}
								await this.incrementCounter(message.id || -1);
								newWorker.postMessage({ type: 'ack' });
							}
						});
					}
				});
				newWorker.once('online', () => {
					newWorker.postMessage({ type: 'run' });
				});
				newWorker.once('error', (error) => {
					console.log('Noticed workers error: ', error);
					reject();
				});
				newWorker.once('exit', (exitCode) => {
					console.log('Noticed workers exit: ', exitCode);
					if (exitCode === 0) resolve();
					reject();
				});
			});

			this.workers.push(newWorker);
			this.promises.push(workerPromise);
		}

		return Promise.allSettled(this.promises);
	}

	cleanKilWorkers(): Promise<PromiseSettledResult<any>[]> {
		const workerExitStatus: any = [];
		for (let index = 0; index < this.workers.length; index++) {
			workerExitStatus.push(this.workers[index].terminate());
		}
		const exitsPromises = Promise.allSettled(workerExitStatus);
		return exitsPromises;
	}

	private async incrementCounter(id: number) {
		this.requestsCounter++;
		console.log(`Counter: ${this.requestsCounter} Worker: ${id}`);
	}

	private splitWorkloadPerWorker() {
		return splitBranchesArray(this.branchesBatch, this.threadAmount);
	}
}
