import { parentPort, workerData, threadId, TransferListItem, Worker } from 'worker_threads';
import { CUMessageHandlers } from './ContinuesUpdate';
import { IHandlerFunction, MessagesHandler } from './messages/HandleThreadMessages';
import path from 'path';
import { ContinuesUpdatePPort } from '../custom-parent/ContinuesUpdatePPort';
import { BranchUpdaterWorker } from '../custom-worker/BranchUpdaterWorker';
import { IBUMessageHandlers } from './BranchUpdater';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';
import {
	APIRequestCounterData,
	CountRequestsBatch,
	VerifyDepletedMessage,
} from '../atomic-counter/ImplementCounters';

// ###################################################################################################
// ### Setup #########################################################################################
// ###################################################################################################

const branchUpdaters: { [key: number]: BranchUpdaterWorker } = {};
const updaterScriptPath = path.join(__dirname, 'BranchUpdater.js');
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
const requestCounterData = new APIRequestCounterData(requestsPerMinute);

// Ip Manager's Counters.
const countRequestsBatch = new CountRequestsBatch(requestsPerHour, requestsPerMinute);
const verifyDepletedMessage = new VerifyDepletedMessage(requestCounterData);

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
		messagesHandler.handle({ handlerName: message.handlerName });
	});
};

// ###################################################################################################
// ### Functions that handle 'on message' events #####################################################
// ###################################################################################################

// These functions will be used to populate 'messagesHandler' object, that
// Handles all 'on message' events.

// ########################################################
// ### Handle Continues Updates (Parent) Messages #########
// ########################################################

/**
 * Handles the 'start-endpoint' message \ event:
 * Creates 'Branch Updater' worker threads,
 * Provides said thread with a 'Proxy Endpoint'.
 */
const hStartEndpoint: IHandlerFunction<IMMessageHandlers, CUMessageHandlers> = () => {
	// Count first batch of requests.
	const countResponse = countRequestsBatch.countConsumedRequests();
	if (countResponse.status === 'stopped') {
		console.error(countResponse);
		throw Error('[Ip Manager][hStartEndpoint] cannot count first batch of requests');
	}

	const endpoint = cUpdate.extractData(workerData);
	if (endpoint) {
		console.log(`#Ip Manager ${threadId} received an endpoint`, workerData);
	} else {
		console.log(`#Ip Manager ${threadId} received no endpoint`);
	}
	for (let index = 0; index < amountOfUpdaters; index++) {
		addUpdater(requestCounterData, endpoint);
	}
};
// Adds hStartEndpoint to the messagesHandler object.
messagesHandler.addMessageHandler('start-endpoint', hStartEndpoint);

/**
 * Handles the 'stop-endpoint' message \ event:
 * Upon this event, Request every branch-updater worker thread to stop execution.
 *! Upon the last worker thread exist, This Ip Manager thread will be Terminated.
 */
const hStopEndpoint: IHandlerFunction<IMMessageHandlers, CUMessageHandlers> = () => {
	console.log(`#Ip Manager ${threadId} received stop endpoint`);
	for (let workerKey in branchUpdaters) {
		branchUpdaters[workerKey].postMessage({ handlerName: 'stop-updates' });
	}
};
// Adds hStopEndpoint to the messagesHandler object.
messagesHandler.addMessageHandler('stop-endpoint', hStopEndpoint);

// ########################################################
// ### Handle Branch Updater (Child) Messages #############
// ########################################################

/**
 * Handles an updater-done message:
 * Requests the sender worker thread to stop execution.
 * @param param0: A call-back that transmits a message back to the sender.
 */
const hUpdaterDone: IHandlerFunction<IMMessageHandlers, IBUMessageHandlers> = ({
	messageCallback,
}) => {
	if (!messageCallback) throw Error();
	messageCallback({ handlerName: 'end-updater' });
};
messagesHandler.addMessageHandler('updater-done', hUpdaterDone);

/**
 * Handles an updater-depleted message:
 * Requests the sender worker thread to stop execution.
 * @param param0: A call-back that transmits a message back to the sender.
 */
const hUpdaterDepleted: IHandlerFunction<IMMessageHandlers, IBUMessageHandlers> = ({
	messageCallback,
}) => {
	if (!messageCallback) throw Error();
	messageCallback({ handlerName: 'stop-updates' });
};
messagesHandler.addMessageHandler('updater-depleted', hUpdaterDepleted);

// ! Maybe Redundant.
/**
 * Handles an updater-request message:
 * An updater-request message represents a decrease of total available requests per IP.
 * This will count up to 'requestsPerMinute' -1, then trigger a wait of one minute,
 * Before allocating new batch of request-tokens to the Branch Updates worker threads.
 * @param param0: The worker thread id of the sender.
 */
const hUpdaterRequest: IHandlerFunction<IMMessageHandlers, IBUMessageHandlers> = ({ senderId }) => {
	console.log(`#Ip Manager ${threadId} noticed Branch Updater ${senderId} made a request`);
};
messagesHandler.addMessageHandler('updater-request', hUpdaterRequest);

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

const updaterMadeRequest = (bUpdaterWorker: BranchUpdaterWorker) => {
	console.log(
		`#Ip Manager ${threadId} Noticed Branch Updater ${bUpdaterWorker.threadId} Made Request`
	);
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
const addUpdater = (counterData: APIRequestCounterData, proxyEndpoint?: ProxyEndpoint) => {
	const bUpdater = new BranchUpdaterWorker(updaterScriptPath, {
		workerData: {
			proxyEndpoint,
			counterData,
		},
	});
	if (bUpdater.threadId !== undefined) {
		bUpdater.once('online', () => updaterIsOnline(bUpdater));
		bUpdater.once('exit', (code) => updaterHasExited(bUpdater, code));
		bUpdater.once('error', (error) => updaterHadError(bUpdater, error));
		bUpdater.on('message', (message) => messagesHandler.handle(message));
		branchUpdaters[bUpdater.threadId] = bUpdater;
	}
};

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
	| 'updater-depleted'
	| 'updater-request';
