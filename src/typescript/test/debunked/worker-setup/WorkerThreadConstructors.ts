// import { APIRequestCounterData } from '../../atomic-counter/ImplementCounters';
// import { BranchUpdaterWorker } from '../../custom-worker/BranchUpdaterWorker';
// import { ProxyEndpoint } from '../../proxy-management/ProxyCollection';
// import { AppointmentUpdateHandler } from '../event-handlers/EventHandlers';

// type BranchUpdatersConstructData = {
// 	counterData: APIRequestCounterData;
// 	proxyEndpoint?: ProxyEndpoint;
// 	pathToUpdaterCode: string;
// 	branchUpdatersAmount: number;
// 	parentThreadID: number;
// };

// export class BuildBranchUpdaters {
// 	private branchUpdaters: { [key: number]: BranchUpdaterWorker } = {};
// 	private counterData;
// 	private pathToUpdaterCode;
// 	private proxyEndpoint;
// 	private branchUpdatersAmount;
// 	private parentThreadID;
// 	private appointmentUpdateHandler;

// 	constructor({
// 		branchUpdatersAmount,
// 		counterData,
// 		pathToUpdaterCode,
// 		proxyEndpoint,
// 		parentThreadID,
// 	}: BranchUpdatersConstructData) {
// 		this.counterData = counterData;
// 		this.pathToUpdaterCode = pathToUpdaterCode;
// 		this.proxyEndpoint = proxyEndpoint;
// 		this.branchUpdatersAmount = branchUpdatersAmount;
// 		this.parentThreadID = parentThreadID;
// 		// Object.assign(this, {...data }); // Wont be private, meh.
// 		this.appointmentUpdateHandler = new AppointmentUpdateHandler();
// 	}

// 	setupWorkers() {
// 		for (let i = 0; i < this.branchUpdatersAmount; i++) {
// 			const bUpdater = new BranchUpdaterWorker(this.pathToUpdaterCode, {
// 				workerData: { counterData: this.counterData, proxyEndpoint: this.proxyEndpoint },
// 			});
// 			if (bUpdater.threadId !== undefined) {
// 				bUpdater.once('online', () => this.updaterIsOnline(bUpdater, this.parentThreadID));
// 				bUpdater.once('exit', (code) =>
// 					this.updaterHasExited(bUpdater, code, this.parentThreadID, this.branchUpdaters)
// 				);
// 				bUpdater.once('error', (error) =>
// 					this.updaterHadError(bUpdater, error, this.parentThreadID, this.branchUpdaters)
// 				);
// 				bUpdater.on(
// 					'message',
// 					(message) => {}
// 					// messagesHandler.handle({ message, worker: bUpdater, parentPort: cUpdate })
// 				);
// 				this.branchUpdaters[bUpdater.threadId] = bUpdater;
// 			}
// 		}
// 	}

// 	private updaterIsOnline(bUpdaterWorker: BranchUpdaterWorker, parentThreadID: number) {
// 		console.log(
// 			`#Ip Manager ${parentThreadID} Noticed Branch Updater ${bUpdaterWorker.threadId} is online`
// 		);
// 		bUpdaterWorker.postMessage({ handlerName: 'start-updates' });
// 	}

// 	private updaterHasExited(
// 		bUpdaterWorker: BranchUpdaterWorker,
// 		exitCode: number,
// 		parentThreadID: number,
// 		branchUpdaters: { [key: number]: BranchUpdaterWorker }
// 	) {
// 		console.log(
// 			`#Ip Manager ${parentThreadID} Noticed Branch Updater ${bUpdaterWorker.threadId} Has exited ${exitCode}`
// 		);
// 		// remove branch updater from storage.
// 		delete branchUpdaters[bUpdaterWorker.threadId];
// 		if (Object.keys(branchUpdaters).length == 0) process.exit(0);
// 	}

// 	private updaterHadError(
// 		bUpdaterWorker: BranchUpdaterWorker,
// 		error: Error,
// 		parentThreadID: number,
// 		branchUpdaters: { [key: number]: BranchUpdaterWorker }
// 	) {
// 		console.log(
// 			`#Ip Manager ${parentThreadID} Noticed Branch Updater ${bUpdaterWorker.threadId} had Error`
// 		);
// 		console.log('Error: ', error);
// 		// remove branch updater from storage.
// 		delete branchUpdaters[bUpdaterWorker.threadId];
// 		if (Object.keys(branchUpdaters).length == 0) process.exit(0);
// 	}
// }
