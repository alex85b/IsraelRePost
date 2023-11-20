import { parentPort, workerData, threadId, Worker } from 'worker_threads';
import path from 'path';
import { CUMessageHandlers } from './ContinuesUpdate';
import { MessagesHandler } from './messages/HandleThreadMessages';
import { CustomMessagePort } from './CParentPort';
import { AxiosProxyConfig } from 'axios';
import { CustomWorker } from './CWorker';
import { IBUMessageHandlers } from './BranchUpdater';

const branchUpdaters: { [key: number]: Worker } = {};
const updaterScriptPath = path.join(__dirname, 'IpManager.js');
const messagesHandler = new MessagesHandler<IMMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);
const cUpdate = new CustomMessagePort(parentPort);

// Sets up communication with current thread.
const listen = () => {
	cUpdate.on<CUMessageHandlers>('message', async (message) => {
		console.log(`#Worker thread ${threadId} received ${message.handlerName} message`);
	});
};

// Define Message Handlers.
messagesHandler.addMessageHandler('start-endpoint', ({ message }) => {
	if (message.handlerData) {
		// Endpoint was passed - managing proxy.
		// Start M Updaters - pass a proxy to each one.
	} else {
		// No endpoint had been passed - managing current Ip.
		// Start N Updaters - pass no proxy.
	}
});

/**
 * Adds a Child Worker Thread to perform: branch services updater.
 * @param proxy Optional, a definition of axios proxy.
 */
const addUpdater = (proxy?: AxiosProxyConfig) => {
	const bUpdater = new CustomWorker(updaterScriptPath, { workerData: proxy });
	if (bUpdater.threadId !== undefined) {
		bUpdater.once('online', () => updaterIsOnline(bUpdater));
		branchUpdaters[bUpdater.threadId] = bUpdater;
	}
};

// ########################################################
// ### Listeners and Events with: CUpdate #################
// ########################################################

/**
 * Report to Continues Handlers that Ip Manager is Done,
 * Updaters signaled 'Done'.
 */
const reportDone = () => {
	cUpdate.postMessage<CUMessageHandlers>({ handlerName: 'manager-done' });
	console.log(`#Worker thread ${threadId} sends 'manager-done' message`);
};

/**
 * Report to Continues Handlers that Ip Manager is Depleted,
 * Maximal amount of requests made for current hour.
 * Ip Manager is effectively Locked-out for one hour.
 */
const reportDepleted = () => {
	cUpdate.postMessage<CUMessageHandlers>({ handlerName: 'manager-depleted' });
	console.log(`#Worker thread ${threadId} sends 'manager-depleted' message`);
};

// ########################################################
// ### Listeners and Events with: BUpdater ################
// ########################################################

const updaterIsOnline = (worker: CustomWorker) => {
	console.log(`Ip Manager ${worker.threadId} is online`);
	worker.postMessage<IBUMessageHandlers>({ handlerName: 'start-updates' });
};

// ########################################################
// ### Launch #############################################
// ########################################################

listen();
// reportDone();
// reportDepleted();

// ###################################################################################################
// ### Enums #########################################################################################
// ###################################################################################################

// ###################################################################################################
// ### helper Class ##################################################################################
// ###################################################################################################

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type IMMessageHandlers =
	| 'start-endpoint'
	| 'stop-endpoint'
	| 'updater-done'
	| 'updater-depleted';
