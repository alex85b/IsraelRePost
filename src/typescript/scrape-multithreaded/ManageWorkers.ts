import { Worker } from 'worker_threads';
import { Mutex } from 'async-mutex';
import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import {
	IWorkerBranchScraped,
	IWorkerDataMessage,
	IWorkerRequest,
	IWorkerScrapeDone,
} from './WorkerNew';
import { errors } from '@elastic/elasticsearch';

export interface IProxyAuthObject {
	proxyAuth: {
		password: string;
		username: string;
	};
	proxyUrl: string;
	useProxy: boolean;
}

export interface IWorkerData {
	workerId: number;
	processBranches: ISingleBranchQueryResponse[];
	proxyConfig: IProxyAuthObject;
}

export interface IConstructorOptions {
	workerScriptPath: string;
	requestsLimit: number;
	requestsTimeout: number;
	threadAmount: number;
	branchesBatch: ISingleBranchQueryResponse[];
	proxyConfig: IProxyAuthObject;
}

interface IBranchIndexMap {
	[key: number]: ISingleBranchQueryResponse;
}

export class ManageWorkers {
	private workerScriptPath: string;
	private requestsLimit: number;
	private requestsTimeout: number;
	private threadAmount: number;
	private requestsCounter = 0;
	private isDelayed = false;
	private sharedDelay: Promise<void> | null = null;
	private mutex = new Mutex();
	private workers: Worker[] = [];
	private workersObj: { [key: number]: Worker | null } = {};
	private initEvents: Promise<number>[] = [];
	private scrapeEvents: Promise<number>[] = [];
	private branchesBatch: ISingleBranchQueryResponse[];
	private proxyConfig: IProxyAuthObject;
	// private workLoad: ISingleBranchQueryResponse[][] = [];
	private workLoad: IBranchIndexMap[] = [];
	private runErrors: any[] = [];

	constructor(options: IConstructorOptions) {
		this.workerScriptPath = options.workerScriptPath;
		this.requestsLimit = options.requestsLimit ?? 48;
		this.requestsTimeout = options.requestsTimeout ?? 61000;
		this.threadAmount = options.threadAmount ?? 2;
		this.branchesBatch = options.branchesBatch ?? [];
		this.proxyConfig = options.proxyConfig;
	}

	constructWorkLoad() {
		// Create a cell for each worker.
		for (let index = 0; index < this.threadAmount; index++) {
			this.workLoad.push({});
		}
		let depth = -1;
		const workerIndexGen = this.zeroToNCircularly(this.threadAmount);
		while (this.branchesBatch.length > 0) {
			const workerIndex = workerIndexGen.next().value;
			if (workerIndex === 0) depth++;
			const branch = this.branchesBatch.pop();
			if (!branch) break;
			this.workLoad[workerIndex][depth] = branch;
		}
	}

	getWorkLoadArray() {
		return this.workLoad;
	}

	getRunErrors() {
		return JSON.parse(JSON.stringify(this.runErrors));
	}

	private *zeroToNCircularly(lastNumber: number): Generator<number> {
		let currentNumber = 0;
		while (true) {
			yield currentNumber;
			currentNumber = (currentNumber + 1) % lastNumber;
		}
	}

	async spawnWorkers() {
		if (this.workers.length !== 0) return null;
		for (let index = 0; index < this.threadAmount; index++) {
			try {
				const newWorker = this.setupWorker(index);
				const initEvents = this.setupInitEvent(newWorker, index);
				// this.workers.push(newWorker);
				this.workersObj[index] = newWorker;
				this.initEvents.push(initEvents);
			} catch (error) {
				console.error(
					'[spawnWorkers] Error during "setupWorker" or "setupInitEvent": ',
					error
				);
			}
		}

		const settledEvents = await Promise.allSettled(this.initEvents);
		for (let index = 0; index < settledEvents.length; index++) {
			const event = settledEvents[index];
			if (event.status === 'rejected') {
				this.workersObj[index] = null;
			}
		}
		this.initEvents = [];

		// console.log('[spawnWorkers] workers: ', this.workersObj);

		return JSON.parse(JSON.stringify(this.workersObj));
	}

	// Add scrape branches events to each worker.
	async workersScrapeBranches() {
		for (const workerIndex in this.workersObj) {
			const worker = this.workersObj[workerIndex];
			try {
				if (!worker) continue;
				this.scrapeEvents.push(
					this.setupScrapeEvent(worker, Number.parseInt(workerIndex))
				);
			} catch (error) {
				console.error(
					'[workersScrapeBranches] Error during "setupScrapeEvent": ',
					error
				);
			}
		}
		const settledEvents = await Promise.allSettled(this.scrapeEvents);
		for (let index = 0; index < settledEvents.length; index++) {
			console.log('[workersScrapeBranches] event index: ', index);
		}
		this.scrapeEvents = [];

		// console.log('[workersScrapeBranches] branches:');
		// for (const branchBatches of this.workLoad) {
		// 	for (const index in branchBatches) {
		// 		console.log(branchBatches[index]);
		// 	}
		// }

		return JSON.parse(JSON.stringify(settledEvents));
	}

	private setupWorker(index: number) {
		return new Worker(this.workerScriptPath, {
			workerData: {
				workerId: index,
				processBranches: Object.values(this.workLoad[index]),
				proxyConfig: this.proxyConfig,
			},
		});
	}

	private setupInitEvent(worker: Worker, workerId: number) {
		return new Promise<number>((resolve, reject) => {
			worker.once('message', (message) =>
				this.onWorkerInitMessage(message, resolve, reject, workerId)
			);
			worker.once('error', (error) =>
				this.onWorkerInitError(error, reject, workerId)
			);
			worker.once('exit', (code) =>
				this.onWorkerInitExit(code, resolve, reject, workerId)
			);
			worker.postMessage({ type: 'init' });
		});
	}

	private setupScrapeEvent(worker: Worker, workerId: number) {
		return new Promise<number>((resolve, reject) => {
			worker.on('message', (message) => {
				this.onWorkerScrapeMessage(message, resolve, reject, workerId, worker);
			});
			worker.once('error', (error) =>
				this.onWorkerScrapeError(error, reject, workerId)
			);
			worker.once('exit', (code) =>
				this.onWorkerScrapeExit(code, resolve, reject, workerId)
			);
			worker.postMessage({ type: 'scrape' });
		});
	}

	private async onWorkerScrapeMessage(
		message: IWorkerBranchScraped | IWorkerRequest | IWorkerScrapeDone,
		resolve: (reason: number) => void,
		reject: (reason: number) => void,
		workerId: number,
		worker: Worker
	) {
		switch (message.type) {
			case 'WorkerRequest':
				this.criticalArea(message.id);
				worker.postMessage({ type: 'ack' });
				break;
			case 'WorkerBranchScraped':
				console.log('[WorkerBranchScraped] message: ', message);
				if (message.status === 's') {
					if (workerId !== message.id) {
						throw new Error(
							`[onWorkerScrapeMessage] workerId ${workerId} !=message.id ${message.id}`
						);
					}
					if (typeof message.branchIndex === 'number' && message.branchIndex > -1) {
						delete this.workLoad[workerId][message.branchIndex];
					}
				}
				break;
			case 'WorkerScrapeDone':
				console.log('[WorkerScrapeDone] message: ', message);
				if (message.status === 'f') {
					if (message.errors) {
						for (const error of message.errors) {
							this.runErrors.push(error);
						}
					}
					reject(workerId);
				}
				resolve(workerId);
				break;
			default:
				console.error('[onWorkerScrapeMessage] unknown request: ', message);
				reject(workerId);
		}
	}

	private async onWorkerScrapeError(
		error: Error,
		reject: (reason: number) => void,
		workerId: number
	) {
		this.onWorkerInitError(error, reject, workerId);
	}

	private async onWorkerScrapeExit(
		code: number,
		resolve: (reason: number) => void,
		reject: (reason: number) => void,
		workerId: number
	) {
		this.onWorkerInitExit(code, resolve, reject, workerId);
	}

	private async onWorkerInitMessage(
		message: IWorkerDataMessage,
		resolve: (reason: number) => void,
		reject: (reason: number) => void,
		workerId: number
	) {
		if (message.type === 'WorkerDataMessage') {
			if (message.status === 's') resolve(workerId);
			if (message.status === 'f') {
				this.runErrors.push(message);
				// console.log('[onWorkerMessage] Message: ', message);
				reject(workerId);
			}
		}
		reject(workerId);
	}

	private async onWorkerInitError(
		error: Error,
		reject: (reason: number) => void,
		workerId: number
	) {
		console.log(`Noticed worker ${workerId} error: `, error);
		reject(workerId);
	}

	private async onWorkerInitExit(
		code: number,
		resolve: (reason: number) => void,
		reject: (reason: number) => void,
		workerId: number
	) {
		console.log(`Noticed worker ${workerId} exit-code: `, code);
		if (code === 0) resolve(workerId);
		reject(workerId);
	}

	private async criticalArea(workerId: number, debug: boolean = false) {
		if (debug)
			console.log(`[criticalArea] worker ${workerId} entered the "criticalArea"`);
		await this.mutex.runExclusive(async () => {
			// Counter is below 'requestsLimit'.
			if (this.requestsCounter < this.requestsLimit) {
				this.requestsCounter++;
				if (debug)
					console.log(
						`[criticalArea] worker ${workerId} increased counter to: ${this.requestsCounter}`
					);
			}
			// Counter NOW at 'requestsLimit', 'isDelayed' false, this triggers 'delay'.
			if (
				this.requestsCounter === this.requestsLimit &&
				this.isDelayed === false
			) {
				console.log(`[criticalArea] worker ${workerId} triggered delay`);
				this.isDelayed = true;
				this.sharedDelay = new Promise((resolve) => {
					setTimeout(() => {
						this.requestsCounter = 0;
						resolve();
					}, this.requestsTimeout);
				});
				await this.sharedDelay;
				this.sharedDelay = null;
				this.isDelayed = false;
			}
			// Counter NOW at 'requestsLimit', 'isDelayed' true, this waits for shared 'timeout'.
			if (this.requestsCounter === this.requestsLimit && this.isDelayed === true) {
				console.log(`[criticalArea] worker ${workerId} awaits delay end`);
				await this.sharedDelay;
			}
		});
	}
}
