import { parentPort, threadId, workerData, MessagePort } from 'worker_threads';
import { IHandlerFunction, MessagesHandler } from '../worker-messaging/HandleThreadMessages';
import { IpManagerParentPort } from '../components/custom-parent/IpManagerParentPort';
import { ProxyEndpoint } from '../../../data/proxy-management/ProxyCollection';
import {
	APIRequestCounterData,
	CountAPIRequest,
} from '../components/atomic-counter/ImplementCounters';
import { BranchesToProcess } from '../../../data/redis/BranchesToProcess';
import {
	RetrieveBranchServices,
	RetrieveBranchServicesOptions,
} from '../../../api/chain-requests/RetrieveBranchServices';
import { IMMessageHandlers } from './IpManagerWorkerScript';
import { ACustomParentPort } from '../components/custom-parent/ACustomParentPort';
import { BranchModule } from '../../../data/elastic/BranchModel';
import { ErrorModule } from '../../../data/elastic/ErrorModel';
import { AppointmentsHandlerData } from '../../../concepts/workers/logic/AppointmentsMessageHandler';

// ###################################################################################################
// ### Setup #########################################################################################
// ###################################################################################################

const messagesHandler = new MessagesHandler<IBUMessageHandlers>();
if (!parentPort) throw Error(`IpManager ${threadId ?? -1}: parent port is null \ undefined`);
const ipManager = new IpManagerParentPort(parentPort);
const { proxyEndpoint, counterData } = ipManager.extractData(workerData);

// const branchUpdater = new BranchUpdater({ counterData, parentPort: ipManager, proxyEndpoint });

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
const hStartUpdates: IHandlerFunction<IBUMessageHandlers, IMMessageHandlers> = async ({
	parentPort,
}) => {
	// if (!parentPort || !branchesToProcess || !requestCounter) {
	// 	throw Error(
	// 		`[Branch Updater: ${threadId}][hStartUpdates] received no${
	// 			parentPort ? '' : ' parentPort'
	// 		}${branchesToProcess ? '' : ' branchesToProcess'}${
	// 			requestCounter ? '' : ' requestCounter'
	// 		}`
	// 	);
	// }
	// // From redis-online, get a branch data - for appointments update.
	// const updateBranch = await processQueue.dequeueBranch();
	// if (!updateBranch) {
	// 	parentPort.postMessage({ handlerName: 'updater-done' });
	// 	return;
	// }
	// // Summon performUpdate helper function.
	// const updateStatus = performUpdate({ branchesToProcess, parentPort, requestCounter });
	// TODO: decide what to do based on the status.
};
messagesHandler.addMessageHandler('start-updates', hStartUpdates);

// 'stop-updates'
messagesHandler.addMessageHandler('stop-updates', () => {});

// 'end-updater'
messagesHandler.addMessageHandler('end-updater', () => {});

// 'continue-updates'
messagesHandler.addMessageHandler('continue-updates', () => {});

// ###################################################################################################
// ### Helper Functions ##############################################################################
// ###################################################################################################

interface IPerformUpdateData {
	branchesToProcess: BranchesToProcess;
	branchAppointments?: RetrieveBranchServices; // If not provided, a new one will be constructed.
	requestCounter: CountAPIRequest;
	parentPort: ACustomParentPort<IBUMessageHandlers, IMMessageHandlers>;
}

const performUpdate = async (performUpdateData: IPerformUpdateData) => {
	const { branchesToProcess, branchAppointments, requestCounter, parentPort } = performUpdateData;
	let updaterClass: RetrieveBranchServices | undefined;

	if (branchAppointments) {
		// BranchAppointments has been provided, recovering after a 'Depleted' scenario.
		updaterClass = branchAppointments;
	} else {
		// A brand new update.
		// Fetch a Branch data, to perform appointments update.
		const updateBranch = await branchesToProcess.dequeueBranch();
		if (!updateBranch) return 'updater-done'; // No more branches.
		const { branchId, qnomycode } = updateBranch;

		// Construct BranchAppointments (data then class).
		const branchAppointmentOptions: RetrieveBranchServicesOptions = {
			branchCodePair: { branchId, qnomycode },
			requestCounter,
		};
		updaterClass = new RetrieveBranchServices(branchAppointmentOptions);
	} // At this point i should have updater class ready.

	// Perform an Update of branch's appointments and \ or errors.
	const status = await updaterClass.performUpdate();
	console.log(`$Branch Updater ${threadId} performed update. Status:${status}`);
	updaterClass.printAppointments();
	updaterClass.printUpdateErrors();
	switch (status) {
		case 'Depleted':
			return 'Depleted';
		case 'Done':
			// Write updated-appointment to Database (Currently Elastic).

			break;
		case 'Error':
			// Write update-errors to Database (Currently Elastic).
			break;
	}
};

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

// ###################################################################################################
// ### Class #########################################################################################
// ###################################################################################################
