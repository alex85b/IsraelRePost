import { parentPort, workerData, threadId, TransferListItem, Worker } from 'worker_threads';
import { CUMessageHandlers } from './ContinuesUpdate';
import { IHandlerFunction, MessagesHandler } from './messages/HandleThreadMessages';
import { AxiosProxyConfig } from 'axios';
import path from 'path';
import { ContinuesUpdatePPort } from '../custom-parent/ContinuesUpdatePPort';
import { BranchUpdaterWorker } from '../custom-worker/BranchUpdaterWorker';
import { IBUMessageHandlers } from './BranchUpdater';
import { RequestsAllowed } from '../atomic-counter/RequestsAllowed';
import { RequestCounter } from '../atomic-counter/RequestCounter';

const branchUpdaters: { [key: number]: BranchUpdaterWorker } = {};
const updaterScriptPath = path.join(__dirname, 'BranchUpdater.js');
const messagesHandler = new MessagesHandler<IMMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);
const cUpdate = new ContinuesUpdatePPort(parentPort);

const safetyMeasure = 2;
const requestsPerHour = 300 - safetyMeasure;
const requestsPerMinute = 50 - safetyMeasure;
const avgRequestsPerBranch = 8;
const amountOfUpdaters = 1;
// Math.floor(requestsPerMinute / avgRequestsPerBranch);

// Atomic Counters.
const requestsAllowed = new RequestsAllowed({ allowedRequests: requestsPerMinute });
const requestCounter = new RequestCounter({ reset: true });

// ########################################################
// ### Set Up Communication with This Thread ##############
// ########################################################

/**
 * Listens to parent's massages,
 * Then uses 'MessagesHandler' to handle said massages.
 */
const listen = () => {
	cUpdate.on('message', async (message) => {
		console.log(`#Ip Manager ${threadId} received ${message.handlerName} message`);
		messagesHandler.handle({ handlerName: message.handlerName });
	});
};

// ###################################################################################################
// ### Define & Store 'Incoming-Messages' Handler Functions ##########################################
// ###################################################################################################

// ########################################################
// ### Continues Updates Messages #########################
// ########################################################

/**
 * Handles the 'start-endpoint' message \ event:
 * Creates Branch Updater worker threads,
 * Pass 'AxiosProxyConfig' to each worker thread.
 */
const hStartEndpoint: IHandlerFunction<IMMessageHandlers, CUMessageHandlers> = () => {
	const endpoint = cUpdate.extractData(workerData);
	let maybeAxiosProxyConfig: AxiosProxyConfig | undefined;
	if (endpoint) {
		console.log(`#Ip Manager ${threadId} received `, workerData);
		maybeAxiosProxyConfig = {
			host: endpoint.host,
			port: endpoint.port,
			auth: { password: endpoint.auth!.password, username: endpoint.auth!.username },
		};
	} else {
		console.log(`#Ip Manager ${threadId} received no endpoint`);
	}
	for (let index = 0; index < amountOfUpdaters; index++) {
		addUpdater(maybeAxiosProxyConfig);
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
// ### Branch Updater Messages ############################
// ########################################################

/**
 * Handles an updater-done message:
 * Requests the sender worker thread to stop execution.
 * @param param0: A call-back that transmits a 'handleable' message back to the sender.
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
 * @param param0: A call-back that transmits a 'handleable' message back to the sender.
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

// ########################################################
// ### Create Branch Updaters Worker Thread  ##############
// ########################################################

/**
 * Adds a Child Worker Thread to perform: branch services updater.
 * @param proxy Optional, a definition of axios proxy.
 */
const addUpdater = (proxy?: AxiosProxyConfig) => {
	const bUpdater = new BranchUpdaterWorker(updaterScriptPath, {
		workerData: proxy,
		requestsAllowed: requestsAllowed.getMemoryBuffer(),
		requestCounter: requestCounter.getMemoryBuffer(),
	});
	if (bUpdater.threadId !== undefined) {
		bUpdater.once('online', () => updaterIsOnline(bUpdater));
		bUpdater.once('exit', (code) => updaterHasExited(bUpdater, code));
		bUpdater.once('error', (error) => updaterHadError(bUpdater, error));
		bUpdater.on('message', (message) => messagesHandler.handle(message));
		branchUpdaters[bUpdater.threadId] = bUpdater;
	}
};

// ########################################################
// ### Functions To Signal to Continues Update ############
// ########################################################

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

// ########################################################
// ### Functions to Handle BranchUpdaterWorker Events #####
// ########################################################

const updaterIsOnline = (bUpdaterWorker: Worker) => {
	// Will prevent Branch Updaters from performing too many requests.

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

// ########################################################
// ### Launch #############################################
// ########################################################

listen();

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IpMWorkerData {
	aProxyConfig?: AxiosProxyConfig;
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
