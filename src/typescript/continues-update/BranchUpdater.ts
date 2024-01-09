import { parentPort, threadId, workerData } from 'worker_threads';
import { MessagesHandler } from './messages/HandleThreadMessages';
import { IpManagerParentPort } from '../custom-parent/IpManagerParentPort';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';
import {
	APIRequestCounterData,
	CountAPIRequest,
	CountRequestsBatch,
} from '../atomic-counter/ImplementCounters';
import { BranchesToProcess } from '../redis/BranchesToProcess';
import {
	BranchAppointments,
	BranchAppointmentOptions,
} from '../appointments-update/BranchAppointment';

// ###################################################################################################
// ### Setup #########################################################################################
// ###################################################################################################

const messagesHandler = new MessagesHandler<IBUMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);
const ipManager = new IpManagerParentPort(parentPort);
const { proxyEndpoint, counterData } = ipManager.extractData(workerData);
const processQueue = new BranchesToProcess();
const CountRequests = new CountAPIRequest(counterData);
let branchAppointments: BranchAppointments | undefined;

console.log(`$Branch Updater ${threadId} received counterData`, counterData);
console.log(`$Branch Updater ${threadId} received proxyEndpoint`, proxyEndpoint);

// ###################################################################################################
// ### Listens to Ip-Manager's instructions ##########################################################
// ###################################################################################################

const listen = () => {
	parentPort?.on('message', (message) => {
		console.log(`$Branch Updater ${threadId} received ${message.handlerName} message`);
		messagesHandler.handle({ message, parentPort: ipManager });
	});
};

// ###################################################################################################
// ### Functions that handle 'on message' events #####################################################
// ###################################################################################################

// These functions will be used to populate 'MessagesHandler' object, that
// Handles all 'on message' events.

// 'start-updates'
messagesHandler.addMessageHandler('start-updates', async () => {
	// From redis-online, get a branch data - for appointments update.
	const updateBranch = await processQueue.dequeueBranch();
	if (!updateBranch) return; // No more branches.
	const { branchId, qnomycode } = updateBranch;
	// Construct appointment update data.
	const branchAppointmentOptions: BranchAppointmentOptions = {
		branchCodePair: { branchId, qnomycode },
		requestCounter: CountRequests,
	};
	// Setup an updater class.
	branchAppointments = new BranchAppointments(branchAppointmentOptions);
	const status = await branchAppointments.performUpdate();
	console.log(`$Branch Updater ${threadId} performed update. Status:${status}`);
	branchAppointments.printAppointments();
	branchAppointments.printUpdateErrors();
});

// 'stop-updates'
messagesHandler.addMessageHandler('stop-updates', () => {});

// 'end-updater'
messagesHandler.addMessageHandler('end-updater', () => {});

// 'continue-updates'
messagesHandler.addMessageHandler('continue-updates', () => {});

// ###################################################################################################
// ### Launch \ Start listening ######################################################################
// ###################################################################################################

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
