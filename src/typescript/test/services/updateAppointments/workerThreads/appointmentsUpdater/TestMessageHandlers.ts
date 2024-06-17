import path from 'path';
import { WorkerWrapper } from '../../../../../services/updateAppointments/helpers/threadCommunication/CommunicationWrappers';
import {
	AppointmentsUpdatingMessages,
	IpManagerUpdaterMessages,
	ThreadMessage,
} from '../../../../../services/updateAppointments/helpers/threadCommunication/Messages';
import { buildUsingProxyFile } from '../../../../../data/models/dataTransferModels/ProxyEndpointString';
import { buildPostOfficePerMinuteLimitTracker } from '../../../../../services/updateAppointments/helpers/consumptionTracker/RequestTracker';

console.log('** Test Message Handlers **');

export const testHandleStartUpdate = async () => {
	console.log('** (1) Test Message Handlers | Test Handle Start Update **');

	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 40,
	});

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, 'WorkerDummyStub.js'),
		workerData: { memoryView },
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log('[testHandleStartUpdate] Incoming Message : ', message);
			communicationWrapper.terminate();
		},

		onErrorCallback(error) {
			console.log('[testHandleStartUpdate] Error : ', error.message);
		},

		onExitCallback(exitCode) {
			console.log('[testHandleStartUpdate] Exit Code : ', exitCode);
		},
	});

	const message: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	communicationWrapper.sendMessage(message);
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

export const testHandleStartUpdateUseProxy = async () => {
	console.log('** (2) Test Message Handlers | Test Handle Start Update Use Proxy **');

	const proxyEndpoint = await gerProxyEndpoint();
	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 40,
	});

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, 'WorkerDummyStub.js'),
		workerData: { proxyEndpoint, memoryView },
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log('[testHandleStartUpdateUseProxy] Incoming Message : ', message);
			communicationWrapper.terminate();
		},

		onErrorCallback(error) {
			console.log('[testHandleStartUpdateUseProxy] Error : ', error.message);
		},

		onExitCallback(exitCode) {
			console.log('[testHandleStartUpdateUseProxy] Exit Code : ', exitCode);
		},
	});

	const message: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	communicationWrapper.sendMessage(message);
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

export const testStartUpdateThenStop = async (useProxy: boolean) => {
	console.log('** (3) Test Message Handlers | Test Start Update Then Stop **');

	const proxyEndpoint = await gerProxyEndpoint();
	const { memoryView } = buildPostOfficePerMinuteLimitTracker({ maximumPerMinute: 48 });

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, 'WorkerDummyStub.js'),
		workerData: { proxyEndpoint, memoryView },
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log('[testStartUpdateThenStop] Incoming Message : ', message);
			communicationWrapper.terminate();
		},

		onErrorCallback(error) {
			console.log('[testStartUpdateThenStop] Error : ', error.message);
		},

		onExitCallback(exitCode) {
			console.log('[testStartUpdateThenStop] Exit Code : ', exitCode);
		},
	});

	const staMessage: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	const stoMessage: ThreadMessage = AppointmentsUpdatingMessages.StopUpdates;

	communicationWrapper.sendMessage(staMessage);
	new Promise<void>((resolve) => {
		setTimeout(() => {
			communicationWrapper.sendMessage(stoMessage);
			resolve();
		}, 15000);
	});
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

export const testStartUpdateThenEndUpdater = async (useProxy: boolean) => {
	console.log('** (4) Test Message Handlers | Test Start Update Then End Updater **');

	const proxyEndpoint = await gerProxyEndpoint();
	const { memoryView } = buildPostOfficePerMinuteLimitTracker({ maximumPerMinute: 48 });

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, 'WorkerDummyStub.js'),
		workerData: { proxyEndpoint, memoryView },
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log('[testStartUpdateThenStop] Incoming Message : ', message);
			communicationWrapper.terminate();
		},

		onErrorCallback(error) {
			console.log('[testStartUpdateThenStop] Error : ', error.message);
		},

		onExitCallback(exitCode) {
			console.log('[testStartUpdateThenStop] Exit Code : ', exitCode);
		},
	});

	const staMessage: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	const endMessage: ThreadMessage = AppointmentsUpdatingMessages.EndUpdater;

	communicationWrapper.sendMessage(staMessage);
	new Promise<void>((resolve) => {
		setTimeout(() => {
			communicationWrapper.sendMessage(endMessage);
			resolve();
		}, 25000);
	});
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

export const testStartUpdateThenContinue = async (useProxy: boolean) => {
	console.log('** (5) Test Message Handlers | Test Start Update Then Continue **');

	const proxyEndpoint = await gerProxyEndpoint();
	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 3,
	});

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, 'WorkerDummyStub.js'),
		workerData: { proxyEndpoint, memoryView },
	});

	let messagesCounter = 0;
	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log('[testStartUpdateThenStop] Incoming Message : ', message);
			if (messagesCounter === 2) {
				console.log('[testStartUpdateThenStop] Sending EndUpdater');
				communicationWrapper.sendMessage(AppointmentsUpdatingMessages.EndUpdater);
			} else if (message === IpManagerUpdaterMessages.UpdaterDepleted) {
				requestTracker.resetTracking({ sharedLimit: 10, resetLocalMemory: true });
				communicationWrapper.sendMessage(AppointmentsUpdatingMessages.ContinueUpdates);
				messagesCounter++;
			}
		},

		onErrorCallback(error) {
			console.log('[testStartUpdateThenStop] Error : ', error.message);
		},

		onExitCallback(exitCode) {
			console.log('[testStartUpdateThenStop] Exit Code : ', exitCode);
		},
	});

	const staMessage: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	communicationWrapper.sendMessage(staMessage);
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

const gerProxyEndpoint = async (): Promise<string> => {
	const envFilepath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '.env');
	console.log('[gerProxyEndpoint] path to env : ', envFilepath);
	const proxyFilepath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'..',
		'..',
		'..',
		'..',
		'WebShare.txt'
	);
	console.log('[gerProxyEndpoint] path to proxy file path : ', proxyFilepath);

	const proxyEndpoints = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: 'PROX_WBSHA_PAS',
		envUsernameKey: 'PROX_WBSHA_USR',
	});

	console.log('[gerProxyEndpoint] proxyEndpoint : ', proxyEndpoints[0]);
	return proxyEndpoints[0];
};
