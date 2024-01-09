import {
	IHandlerFunction,
	IMessage,
	MessagesHandler,
} from '../../continues-update/messages/HandleThreadMessages';
import path from 'path';
import { parentPort } from 'worker_threads';
import { CUMessageHandlers } from '../../continues-update/ContinuesUpdate';
import { IMMessageHandlers } from '../../continues-update/IpManager';
import { ContinuesUpdatePPort } from '../../custom-parent/ContinuesUpdatePPort';
import { BranchAppointments } from '../../appointments-update/BranchAppointment';
import { BranchUpdaterWorker } from '../../custom-worker/BranchUpdaterWorker';
import { IBUMessageHandlers, IBranchUpdaterWData } from '../../continues-update/BranchUpdater';
import { APIRequestCounterData } from '../../atomic-counter/ImplementCounters';

if (parentPort === undefined) throw Error('[conversing_d1] parentPort is undefined');
if (parentPort === null) throw Error('[conversing_d1] parentPort is null');

// Will run passively.
const runConversing = () => {
	console.log('[conversing_d1] Start');

	// Create a message to send from a child (this) to its parent.
	const childMessage: IMessage<CUMessageHandlers> = {
		handlerName: 'manager-depleted',
	};

	// Create a message-handler class.
	// TH: Target handlers is parent's handlers --> IMMessageHandlers.
	const childD1MHandler: MessagesHandler<IMMessageHandlers> = new MessagesHandler();

	// Function will handle a 'start-endpoint' message.
	// TH: Target handlers is child's handlers --> IMMessageHandlers.
	// SH: Source handlers (for a reply message) are parents's handlers --> CUMessageHandlers.
	const childD1Handler: IHandlerFunction<IMMessageHandlers, CUMessageHandlers> = ({
		message, // This function requires a message.
		parentPort, // This function requires a parentPort.
	}) => {
		console.log('[conversing_d1][childD1Handler] message: ', message);
		parentPort!.postMessage({ handlerName: 'manager-depleted' });
	};

	// Add first-child's handler-function to message-handler class.
	childD1MHandler.addMessageHandler('start-endpoint', childD1Handler);

	// Function will handle a 'stop-endpoint' message.
	// TH: Target handlers is child's handlers --> IMMessageHandlers.
	// SH: Source handlers (for a reply message) are second-child's handlers --> IBUMessageHandlers.
	const childD1Handler_2: IHandlerFunction<IMMessageHandlers, IBUMessageHandlers> = ({
		message, // This function requires a message.
		worker, // This function requires a worker.
	}) => {
		console.log('[conversing_d1][childD1Handler] message: ', message);
		worker!.postMessage({ handlerName: 'end-updater' });
	};

	// Add first-child's handler-function to message-handler class.
	childD1MHandler.addMessageHandler('stop-endpoint', childD1Handler_2);

	// Add first-child's handler-function to message-handler class.
	childD1MHandler.addMessageHandler('start-endpoint', childD1Handler);

	// Construct a wrapper for parentPort.
	const continuesUpdatePort = new ContinuesUpdatePPort(parentPort!);

	// Create the second child.
	const data: APIRequestCounterData = new APIRequestCounterData(1);
	const conversing_d2 = new BranchUpdaterWorker(path.join(__dirname, 'conversing_d2.js'), {
		workerData: {
			proxyEndpoint: undefined,
			counterData: data,
		},
	});

	// Add on-message event to the child, so first-child (this) can notice a communication.
	conversing_d2.on('message', (message) =>
		childD1MHandler.handle({
			message: message,
			worker: conversing_d2,
		})
	);

	// Listen to parent.
	continuesUpdatePort?.on('message', (message) => {
		childD1MHandler.handle({
			message: message,
			parentPort: continuesUpdatePort,
			worker: conversing_d2,
		});
	});

	console.log('[conversing_d1] End');
};

runConversing();
