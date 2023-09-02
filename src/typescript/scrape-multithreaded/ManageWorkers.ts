import { Worker } from "worker_threads";
import { Mutex } from "async-mutex";
import { ISingleBranchQueryResponse } from "../interfaces/../elastic/elstClient";
import {
	IWorkerBranchScraped,
	IWorkerDataMessage,
	IWorkerRequest,
	IWorkerScrapeDone,
} from "./WorkerNew";

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
	private workLoad: IBranchIndexMap[] = [];

	constructor(options: IConstructorOptions) {
		this.workerScriptPath = options.workerScriptPath;
		this.requestsLimit = options.requestsLimit ?? 48;
		this.requestsTimeout = options.requestsTimeout ?? 61000;
		this.threadAmount = options.threadAmount ?? 2;
		this.branchesBatch = options.branchesBatch ?? [];
		this.proxyConfig = options.proxyConfig;
	}

	/**
	 * This creates an array of objects for each worker,
	 * each such object will have an index key and a branch as a value,
	 * this maps each branch to a single index and a specific worker.
	 */
	constructWorkLoad() {
		// Create a cell for each worker.
		for (let index = 0; index < this.threadAmount; index++) {
			this.workLoad.push({});
		}
		// This goes to each worker index in the array, and
		// As long as there are branches, This plants a branch at a
		// Specific index that will be named "depth",
		// Each time that branch index is 0, Depth increases by one,
		// Then the next batch of branches will be planted at each Worker index.
		let depth = -1; // Increments immediately.
		// generates an Index from 0 to "amount of threads", an index to each thread.
		const workerIndexGen = this.zeroToNCircularly(this.threadAmount);
		while (this.branchesBatch.length > 0) {
			// Get an index - starts at 0, goes around to 0.
			const workerIndex = workerIndexGen.next().value;
			if (workerIndex === 0) depth++;
			const branch = this.branchesBatch.pop();
			if (!branch) break;
			// Put a branch, in an object under key=depth,
			// In array cell=worker index.
			this.workLoad[workerIndex][depth] = branch;
		}
	}

	/**
	 * A simple getter.
	 * @returns an array of objects, that
	 * represent branches that each worker needs to update.
	 */
	getWorkLoadArray() {
		return this.workLoad;
	}

	/**
	 * A generator function, that
	 * Allows a circular generation of numbers,
	 * Between 0 to the "lastNumber" argument.
	 * @param lastNumber the last number (exclusive) to generate,
	 * Before bouncing back to 0.
	 */
	private *zeroToNCircularly(lastNumber: number): Generator<number> {
		let currentNumber = 0;
		while (true) {
			yield currentNumber;
			currentNumber = (currentNumber + 1) % lastNumber;
		}
	}

	/**
	 * For each allowed thread spawns a new worker, then
	 * Populate the "workersObj" with said worker, then
	 * Start an "setupInitEvent" which sets up the worker,
	 * Populate "initEvents" array with said events.
	 * @returns a promise of the populated "workersObj" or Null,
	 * In case that "workersObj" already populated.
	 */
	async spawnWorkers() {
		if (this.workers.length !== 0) return null;

		// Creates new worker and it's Init-event.
		for (let index = 0; index < this.threadAmount; index++) {
			try {
				const newWorker = this.setupWorker(index);
				const initEvents = this.setupInitEvent(newWorker, index);
				this.workersObj[index] = newWorker;
				this.initEvents.push(initEvents);
			} catch (error) {
				console.error(
					'[spawnWorkers] Error during "setupWorker" or "setupInitEvent": ',
					error
				);
			}
		}

		// Await for all "initEvents" to settle into "settledEvents".
		const settledEvents = await Promise.allSettled(this.initEvents);

		// Iterate each Init-event, for any rejected event "Forget" the worker.
		for (let index = 0; index < settledEvents.length; index++) {
			const event = settledEvents[index];
			if (event.status === "rejected") {
				this.workersObj[index] = null;
			}
		}

		// Resets "initEvents" that holds worker initiations event.
		this.initEvents = [];

		return JSON.parse(JSON.stringify(this.workersObj)) as { [key: number]: Worker | null };
	}

	/**
	 * This setups a "Scrape Event" for each worker, then
	 * Waits for the completion of all those events, then
	 * It returns the completed "Collection" of settle results.
	 * @returns a promise of all the settled "Scrape Event"s.
	 */
	async workersScrapeBranches() {
		/*  Iterate each worker from "workersObj", skip "nulled" workers.
			Create a new "Scrape Event" for each worker, then
			Push said "Scrape Event" into "scrapeEvents" array.*/
		for (const workerIndex in this.workersObj) {
			const worker = this.workersObj[workerIndex];
			try {
				if (!worker) continue;
				this.scrapeEvents.push(this.setupScrapeEvent(worker, Number.parseInt(workerIndex)));
			} catch (error) {
				console.error('[workersScrapeBranches] Error during "setupScrapeEvent": ', error);
			}
		}

		// Await for all "scrapeEvents" to settle into "settledEvents".
		const settledEvents = await Promise.allSettled(this.scrapeEvents);

		// Iterate each Scrape-event, for any rejected event "Forget" the worker.
		// for (let index = 0; index < settledEvents.length; index++) {
		// 	const event = settledEvents[index];
		// 	if (event.status === "rejected") {
		// 		// ?
		// 	}
		// }

		// Resets the "scrapeEvents" array.
		this.scrapeEvents = [];

		return JSON.parse(JSON.stringify(settledEvents)) as PromiseSettledResult<number>[];
	}

	/**
	 * Creates a new worker, Provides to this worker:
	 * An key=index of said worker in the "workersObj" collection.
	 * An array of branches to process, that belongs to the "workLoad" array.
	 * Proxy configurations.
	 * @param index Workers Identification index.
	 * @returns a Worker object.
	 */
	private setupWorker(index: number) {
		return new Worker(this.workerScriptPath, {
			workerData: {
				workerId: index,
				processBranches: Object.values(this.workLoad[index]),
				proxyConfig: this.proxyConfig,
			},
		});
	}

	// ####################################################################################################
	// ### Events Setup ###################################################################################
	// ####################################################################################################

	/**
	 * This creates an event that initiates a new worker.
	 * Said event will be resolved \ rejected according to messages from the worker.
	 * @param worker the actual Worker Entity \ Object that needs a setup.
	 * @param workerId the index of the Worker in the "workersObj" collection.
	 * @returns an exit code of the Worker.
	 */
	private setupInitEvent(worker: Worker, workerId: number) {
		return new Promise<number>((resolve, reject) => {
			// On worker message - trigger "onWorkerInitMessage" ONCE,
			// The onWorkerInitMessage can resolve and reject this "Event".
			worker.once("message", (message) =>
				this.onWorkerInitMessage(message, resolve, reject, workerId)
			);

			// On worker error - trigger "onWorkerInitError" ONCE.
			// The onWorkerInitError can only reject this "Event".
			worker.once("error", (error) => this.onWorkerInitError(error, reject, workerId));

			// On worker exit - trigger "onWorkerInitExit" ONCE.
			// The onWorkerInitExit can resolve and reject this "Event".
			worker.once("exit", (code) => this.onWorkerInitExit(code, resolve, reject, workerId));

			// Send to the worker the command "init",
			// This command will trigger the "Init Event".
			worker.postMessage({ type: "init" });
		});
	}

	/**
	 * This creates an event that request a worker to perform branch scrape.
	 * Said event will be resolved \ rejected according to messages from the worker.
	 * @param worker the actual Worker Entity \ Object that needs a setup.
	 * @param workerId the index of the Worker in the "workersObj" collection.
	 * @returns an exit code of the Worker.
	 */
	private setupScrapeEvent(worker: Worker, workerId: number) {
		return new Promise<number>((resolve, reject) => {
			worker.on("message", (message) => {
				this.onWorkerScrapeMessage(message, resolve, reject, workerId, worker);
			});
			worker.once("error", (error) => this.onWorkerScrapeError(error, reject, workerId));
			worker.once("exit", (code) => this.onWorkerScrapeExit(code, resolve, reject, workerId));
			worker.postMessage({ type: "scrape" });
		});
	}

	// ####################################################################################################
	// ### On message \ exit \ error Functions ############################################################
	// ####################################################################################################

	// TODO: This needs changing.
	/**
	 * This handles "on message" events, that happens during "Scrape Event".
	 * @param message one of several Pre-defined objects that serve as a message.
	 * @param resolve the resolve of the Promise that summons this function.
	 * @param reject the reject of the Promise that summons this function.
	 * @param workerId the index of the Worker in the "workersObj" collection.
	 * @param worker the actual Worker Entity \ Object that needs a setup.
	 */
	private async onWorkerScrapeMessage(
		message: IWorkerBranchScraped | IWorkerRequest | IWorkerScrapeDone,
		resolve: (reason: number) => void,
		reject: (reason: number) => void,
		workerId: number,
		worker: Worker
	) {
		switch (message.type) {
			// In case of "WorkerRequest" message - enter the critical area.
			case "WorkerRequest":
				this.criticalArea(message.id);
				worker.postMessage({ type: "ack" });
				break;
			// In case of "WorkerBranchScraped" - remove handled branch from the workload.
			// TODO: this can be good point to update a remote and stable source that
			// TODO: a branch has been handled and there is no need to try and handle it again.
			case "WorkerBranchScraped":
				console.log("[WorkerBranchScraped] message: ", message);
				if (message.status === "s") {
					if (workerId !== message.id) {
						throw new Error(
							`[onWorkerScrapeMessage] workerId ${workerId} !=message.id ${message.id}`
						);
					}
					if (typeof message.branchIndex === "number" && message.branchIndex > -1) {
						delete this.workLoad[workerId][message.branchIndex];
					}
				}
				break;
			// Reject or resolved this event based on "Done" status.
			case "WorkerScrapeDone":
				console.log("[WorkerScrapeDone] message: ", message);
				if (message.status === "f") {
					reject(workerId);
				}
				resolve(workerId);
				break;
			default:
				console.error("[onWorkerScrapeMessage] unknown request: ", message);
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
		if (message.type === "WorkerDataMessage") {
			if (message.status === "s") resolve(workerId);
			if (message.status === "f") {
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

	// ####################################################################################################
	// ### Critical area using a Mutex ####################################################################
	// ####################################################################################################

	private async criticalArea(workerId: number, debug: boolean = false) {
		if (debug) console.log(`[criticalArea] worker ${workerId} entered the "criticalArea"`);
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
			if (this.requestsCounter === this.requestsLimit && this.isDelayed === false) {
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
