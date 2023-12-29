import { parentPort, threadId, workerData } from 'worker_threads';
import { MessagesHandler } from '../scrape-multithreaded/messages/HandleThreadMessages';
import { IpManagerParentPort } from '../custom-parent/IpManagerParentPort';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';
import { APIRequestCounterData } from '../atomic-counter/ImplementCounters';

const messagesHandler = new MessagesHandler<IBUMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);
const ipManagerParentPort = new IpManagerParentPort(parentPort);
const { proxyEndpoint, counterData } = ipManagerParentPort.extractData(workerData);

// Shared Atomic Counters.
// const requestsAllowed = new RequestsAllowed({ arrayBuffer: requestsAllowedBuffer });
// const requestCounter = new RequestCounter({ reset: false, arrayBuffer: requestCounterBuffer });

// /**
//  * This function checks if API request counter has not reached its limit,
//  * If a limit has reached, a message will be sent to this thread's parent,
//  * 	This Thread will wait to parent's response, before continuing.
//  * If a limit has not reached, Count new request - and exit this function.
//  */
// const verifyBeforeRequest = async () => {
// 	if (!requestsAllowed.isAllowed()) {
// 		// Request is not allowed !

// 		// "Locks" this thread while awaiting for parent's response.
// 		await new Promise<void>((resolve, reject) => {
// 			// Notify parent - and wait for response.
// 			ipManagerParentPort.postMessage({ handlerName: 'updater-depleted' });
// 			ipManagerParentPort.once('message', );
// 		});
// 	}
// };

console.log(`$Branch Updater ${threadId} received buffers`, counterData);

const listen = () => {
	parentPort?.on('message', (message) => {
		console.log(`$Branch Updater ${threadId} received ${message.handlerName} message`);
	});
};

listen();

// ###################################################################################################
// ### Types #########################################################################################
// ###################################################################################################

export type IBUMessageHandlers =
	| 'start-updates'
	| 'stop-updates'
	| 'end-updater'
	| 'continue-updates';

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IBranchUpdaterWData {
	proxyEndpoint: ProxyEndpoint | undefined;
	counterData: APIRequestCounterData;
}
