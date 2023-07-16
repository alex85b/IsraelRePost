import { Worker } from 'worker_threads';
import { Mutex } from 'async-mutex';
import { ISingleBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import { splitBranchesArray } from '../common/SplitBranchesArray';
import { IWorkerDataMessage, IWorkerRequest, IWorkerRerun } from './WorkerNew';

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
	private scrapeEvents: Promise<void>[] = [];
	private branchesBatch: ISingleBranchQueryResponse[];
	private proxyConfig: IProxyAuthObject;
	private workLoad: ISingleBranchQueryResponse[][] = [];
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
		for (let index = 0; index < this.threadAmount; index++) {
			this.workLoad.push([]);
		}
		const indexGenerator = this.circularNumbers(this.threadAmount);
		while (this.branchesBatch.length > 0) {
			const branch = this.branchesBatch.pop();
			if (!branch) break;
			this.workLoad[indexGenerator.next().value].push(branch);
		}
	}

	getWorkLoadArray() {
		return this.workLoad;
	}

	private *circularNumbers(lastNumber: number): Generator<number> {
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

		console.log(this.workersObj);

		return JSON.parse(JSON.stringify(this.workersObj));
	}

	async workersScrapeBranches() {}

	private setupWorker(index: number) {
		return new Worker(this.workerScriptPath, {
			workerData: {
				workerId: index,
				processBranches: this.workLoad[index],
				proxyConfig: this.proxyConfig,
			},
		});
	}

	private setupInitEvent(worker: Worker, workerId: number) {
		return new Promise<number>((resolve, reject) => {
			worker.once('message', (message) =>
				this.onWorkerMessage(message, resolve, reject, workerId)
			);
			worker.once('error', (error) => this.onWorkerError(error, reject, workerId));
			worker.once('exit', (code) =>
				this.onWorkerExit(code, resolve, reject, workerId)
			);

			worker.postMessage({ type: 'init' });
		});
	}

	private setupScrapeEvent(worker: Worker, workerId: number) {
		return new Promise<number>((resolve, reject) => {
			worker.once('message', (message) => {});
			worker.once('error', (error) => {});
			worker.once('exit', (code) => {});

			worker.postMessage({ type: 'scrape' });
		});
	}

	private async onWorkerMessage(
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
		reject(message.id);
	}

	private async onWorkerError(
		error: Error,
		reject: (reason: number) => void,
		workerId: number
	) {
		console.log(`Noticed worker ${workerId} error: `, error);
		reject(workerId);
	}

	private async onWorkerExit(
		code: number,
		resolve: (reason: number) => void,
		reject: (reason: number) => void,
		workerId: number
	) {
		console.log(`Noticed worker ${workerId} exit: `, code);
		if (code === 0) resolve(workerId);
		reject(workerId);
	}
}
