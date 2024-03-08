import { parentPort, workerData, threadId, TransferListItem, Worker } from 'worker_threads';
import { CUMessageHandlers } from '../entry-point/ContinuesUpdateRoot';
import { IHandlerFunction, MessagesHandler } from '../worker-messaging/HandleThreadMessages';
import path from 'path';
import { ContinuesUpdatePPort } from '../components/custom-parent/ContinuesUpdatePPort';
import { BranchUpdaterWorker } from '../components/custom-worker/BranchUpdaterWorker';
import { IBUMessageHandlers } from './AppointmentsWorkerScript';
import { ProxyEndpoint } from '../../../data/proxy-management/ProxyCollection';
// import {
// 	APIRequestCounterData,
// 	CountRequestsBatch,
// } from '../components/atomic-counter/ImplementCounters';
import { NaturalNumbersCounterSetup } from '../components/atomic-counter/CounterSetup';
// import { VerifyDepletedMessage } from '../components/request-regulator/ResetRequestLimiter';

// ###################################################################################################
// ### Setup #########################################################################################
// ###################################################################################################

const branchUpdaters: { [key: number]: BranchUpdaterWorker } = {};
const releaseQueue: BranchUpdaterWorker[] = [];
const updaterScriptPath = path.join(__dirname, 'AppointmentsWorkerScript.js');
const messagesHandler = new MessagesHandler<IMMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);
const cUpdate = new ContinuesUpdatePPort(parentPort);

// How many requests should be held in reserve.
const safetyMargin = 2;

// Total Requests that can be made pen hour Minus a safety margin.
const requestsPerHour = 300 - safetyMargin; // 298

/*
	The total amount of requests that can be made in one minute,
	This will be used as a batch,
	The next batch will be delivered after a minute after the last request is 'Consumed',
	Meaning after the counter drops to 0.
*/
const requestsPerMinute = 50 - safetyMargin; // 48

// An estimation of how much requests an update branch-appointments should consume.
const avgRequestsPerBranch = 8; // TODO: For each branch, Fetch this data instead of relaying on avg.

/*
	The amount of updaters that are needed,
	The goal is for all branch updaters to consume exactly one batch per each update.
	Math.floor(requestsPerMinute / avgRequestsPerBranch);
*/
const amountOfUpdaters = 1; // False - for testing.

// Data for shared request counters.
// const requestCounterData = new APIRequestCounterData(requestsPerMinute);

// Ip Manager's Counters.
// const countRequestsBatch = new CountRequestsBatch(requestsPerHour, requestsPerMinute);
// const verifyDepletedMessage = new VerifyDepletedMessage(
// 	new NaturalNumbersCounterSetup({ counterRange: { bottom: 0, top: 0 } })
// );

// ###################################################################################################
// ### Listens to Continues-Update's instructions ####################################################
// ###################################################################################################

/**
 * Listens to parent's massages,
 * Then uses 'MessagesHandler' to handle said massages.
 * MessagesHandler will be defined separately.
 */
const listen = () => {
	cUpdate.on('message', async (message) => {
		console.log(`#Ip Manager ${threadId} received ${message.handlerName} message`);
		messagesHandler.handle({ message, parentPort: cUpdate });
	});
};

// ###################################################################################################
// ### Functions that handle 'on message' events #####################################################
// ###################################################################################################

// These functions will be used to populate 'MessagesHandler' object, that
// Handles all 'on message' events.

// ########################################################
// ### Handle Continues-Update's (Parent) Messages ########
// ########################################################

/**
 * Handles the 'start-endpoint' message \ event:
 * Creates 'Branch Updater' worker threads,
 * Provides said thread with a 'Proxy Endpoint' string.
 */
const hStartEndpoint: IHandlerFunction<IMMessageHandlers, CUMessageHandlers> = () => {
	// Count the first batch of requests.
	// const countResponse = countRequestsBatch.countConsumedRequests();
	// if (countResponse.status === 'stopped') {
	// 	console.error(countResponse);
	// 	throw Error(
	// 		`[Ip Manager: ${threadId}][hStartEndpoint] cannot count first batch of requests`
	// 	);
	// }

	const endpoint = cUpdate.extractData(workerData);
	if (endpoint) {
		console.log(`#Ip Manager ${threadId} received an endpoint`, workerData);
	} else {
		console.log(`#Ip Manager ${threadId} received no endpoint`);
	}
	for (let index = 0; index < amountOfUpdaters; index++) {
		// addUpdater(requestCounterData, endpoint);
	}
};
// Adds hStartEndpoint to the MessagesHandler object.
messagesHandler.addMessageHandler('start-endpoint', hStartEndpoint);

/**
 * Handles the 'stop-endpoint' message \ event:
 * Upon this event, Request every branch-updater worker thread to stop execution.
 * Upon the last worker thread exist, This Ip-Manager thread will be Terminated.
 */
const hStopEndpoint: IHandlerFunction<IMMessageHandlers, CUMessageHandlers> = () => {
	console.log(`#Ip Manager ${threadId} received stop endpoint`);
	for (let workerKey in branchUpdaters) {
		branchUpdaters[workerKey].postMessage({ handlerName: 'end-updater' });
	}
};
// Adds hStopEndpoint to the messagesHandler object.
messagesHandler.addMessageHandler('stop-endpoint', hStopEndpoint);

// ########################################################
// ### Handle Branch-Updater (Child) Messages #############
// ########################################################

/**
 * Handles an updater-done message:
 * Requests the sender worker thread to stop execution.
 * @param param0: A Branch-update Worker that expects instructions.
 */
const hUpdaterDone: IHandlerFunction<IMMessageHandlers, IBUMessageHandlers> = ({ worker }) => {
	if (!worker)
		throw Error(`[Ip Manager: ${threadId}][hStartEndpoint] hUpdaterDone received no worker`);
	worker.postMessage({ handlerName: 'end-updater' });
};
messagesHandler.addMessageHandler('updater-done', hUpdaterDone);

/**
 * Handles an updater-depleted message:
 * Requests the sender worker thread to stop execution.
 * @param param0: A Branch-update Worker that expects instructions.
 */
const hUpdaterDepleted: IHandlerFunction<IMMessageHandlers, IBUMessageHandlers> = ({
	worker,
	parentPort,
}) => {
	// if (!worker || !parentPort)
	// 	throw Error(
	// 		`[Ip Manager: ${threadId}][hStartEndpoint] hUpdaterDepleted received no ${
	// 			worker === undefined
	// 				? parentPort === undefined
	// 					? 'worker and no parentPort'
	// 					: 'worker'
	// 				: 'parentPort'
	// 		}`
	// 	);
	// // Is 'depleted' message valid ?
	// const { isFirst, isValid, lowestBoundary } = verifyDepletedMessage.isValidDepleted();
	// // Not 'depleted' at all (request-batch is not depleted).
	// if (!lowestBoundary) {
	// 	// Signal to the branch-updater to continue (false alarm).
	// 	worker.postMessage({ handlerName: 'continue-updates' });
	// }
	// // Really 'depleted' but not the first.
	// if (lowestBoundary && !isFirst) {
	// 	// Add messageCallback to the release queue.
	// 	releaseQueue.push(worker);
	// 	// A continue-updates will be sent after reset.
	// }
	// // Message is valid: Both valid 'depleted' and the first 'depleted'.
	// if (isValid) {
	// 	// Check if a new request batch can be created.
	// 	const { status, value } = countRequestsBatch.countConsumedRequests();
	// 	if (status === 'success') {
	// 		// A new request-batch can be prepared, perform delayed reset.
	// 		setTimeout(() => {
	// 			resetBatchAndCounters(requestsPerMinute);
	// 		}, 61000);
	// 	} else {
	// 		// Cannot make new request-batch, maybe can make smaller batch.
	// 		if (value > 0) {
	// 			// A smaller request-batch can be made.
	// 			setTimeout(() => {
	// 				resetBatchAndCounters(value);
	// 			}, 61000);
	// 		}
	// 		// No more requests can be made from this endpoint.
	// 		// Close this thread and it's children.
	// 		for (let workerKey in branchUpdaters) {
	// 			branchUpdaters[workerKey].postMessage({ handlerName: 'end-updater' });
	// 		}
	// 	}
	// }
};
messagesHandler.addMessageHandler('updater-depleted', hUpdaterDepleted);

// ###################################################################################################
// ### Functions to Handle Branch Updater (Child) Events #############################################
// ###################################################################################################

// Will be used to handle common events of 'Child' threads,
// Excluding the 'on message' event that will be handled separately.

const updaterIsOnline = (bUpdaterWorker: Worker) => {
	console.log(
		`#Ip Manager ${threadId} Noticed Branch Updater ${bUpdaterWorker.threadId} is online`
	);
	bUpdaterWorker.postMessage({ handlerName: 'start-updates' });
};

const updaterHasExited = (bUpdaterWorker: BranchUpdaterWorker, exitCode: number) => {
	console.log(
		`#Ip Manager ${threadId} Noticed Branch Updater ${bUpdaterWorker.threadId} Has exited ${exitCode}`
	);
	// remove branch updater from storage.
	delete branchUpdaters[bUpdaterWorker.threadId];
	if (Object.keys(branchUpdaters).length == 0) process.exit(0);
};

const updaterHadError = (bUpdaterWorker: BranchUpdaterWorker, error: Error) => {
	console.log(
		`#Ip Manager ${threadId} Noticed Branch Updater ${bUpdaterWorker.threadId} had Error`
	);
	console.log('Error: ', error);
	// remove branch updater from storage.
	delete branchUpdaters[bUpdaterWorker.threadId];
	if (Object.keys(branchUpdaters).length == 0) process.exit(0);
};

// ###################################################################################################
// ### Create Branch Updaters Worker Thread ##########################################################
// ###################################################################################################

// Creates a Child thread that performs the Branch Appointments Update.
// This will encapsulate responses to each

/**
 * Adds a Child Worker Thread to perform: branch appointments update.
 * @param proxy Optional, a definition of 'ProxyEndpoint'
 */
// const addUpdater = (counterData: APIRequestCounterData, proxyEndpoint?: ProxyEndpoint) => {
// 	const bUpdater = new BranchUpdaterWorker(updaterScriptPath, {
// 		workerData: {
// 			proxyEndpoint,
// 			counterData,
// 		},
// 	});
// 	if (bUpdater.threadId !== undefined) {
// 		bUpdater.once('online', () => updaterIsOnline(bUpdater));
// 		bUpdater.once('exit', (code) => updaterHasExited(bUpdater, code));
// 		bUpdater.once('error', (error) => updaterHadError(bUpdater, error));
// 		bUpdater.on('message', (message) =>
// 			messagesHandler.handle({ message, worker: bUpdater, parentPort: cUpdate })
// 		);
// 		branchUpdaters[bUpdater.threadId] = bUpdater;
// 	}
// };

// ###################################################################################################
// ### Outgoing 'Signal' Functions ###################################################################
// ###################################################################################################

// Will be used to inform 'Parent' about internal events and events of this thread's Children.

/**
 * Report to Continues Update Handlers, that this Ip Manager is Done:
 * Branch Updaters signaled 'Done'.
 */
const ipManagerDone = () => {
	cUpdate.postMessage({ handlerName: 'manager-done' });
	console.log(`#Ip Manager ${threadId} sends 'manager-done' message`);
};

/**
 * Report to Continues Update Handlers, that Ip Manager is Depleted,
 * Maximal amount of requests made for current hour.
 * Ip Manager is effectively Locked-out for one hour.
 */
const ipManagerDepleted = () => {
	cUpdate.postMessage({ handlerName: 'manager-depleted' });
	console.log(`#Ip Manager ${threadId} sends 'manager-depleted' message`);
};

// ###################################################################################################
// ### Helper Functions ##############################################################################
// ###################################################################################################

const resetBatchAndCounters = (batchSize: number) => {
	// // Reset request-batch counter to batch-size.
	// // This also blocks addition to 'releaseQueue'.
	// verifyDepletedMessage.resetRequestCounter(batchSize);
	// // Reset first-depleted counter.
	// verifyDepletedMessage.resetDepletedCounter();
	// // Return 'continue' message to all awaiting workers.
	// releaseQueue.forEach((worker) => worker.postMessage({ handlerName: 'continue-updates' }));
};

// ###################################################################################################
// ### Launch \ Start listening ######################################################################
// ###################################################################################################

listen();

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// This is the data that Ip Manager expect to receive.
export interface IpMWorkerData {
	proxyEndpoint: ProxyEndpoint | undefined;
}

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type IMMessageHandlers =
	| 'start-endpoint'
	| 'stop-endpoint'
	| 'updater-done'
	| 'updater-depleted';
