// import {
// 	IHandlerFunction,
// 	IMessage,
// 	MessagesHandler,
// } from '../../services/appointments-update/worker-messaging/HandleThreadMessages';
// import path from 'path';
// import { IpManagementWorker } from '../../services/appointments-update/components/custom-worker/IpManagementWorker';
// import { IMMessageHandlers } from '../../services/appointments-update/worker-scripts/IpManagerWorkerScript';
// import { CUMessageHandlers } from '../../services/appointments-update/entry-point/ContinuesUpdateRoot';

// // A stop flag.
// let stop: boolean = false;

// // Test a "conversation" between threads.
// export const conversing = (run: boolean) => {
// 	if (!run) return;
// 	console.log('[conversing_d0] Start');

// 	// Create a message to send from parent (this) to first child.
// 	const parentMessage: IMessage<IMMessageHandlers> = {
// 		handlerName: 'start-endpoint',
// 	};

// 	// Create a message-handler class.
// 	// TH: Target handlers is parent's handlers --> CUMessageHandlers.
// 	const parentMHandler: MessagesHandler<CUMessageHandlers> = new MessagesHandler();

// 	// Function will handle a 'manager-depleted' message.
// 	// TH: Target handlers is parent's handlers --> CUMessageHandlers.
// 	// SH: Source handlers (for a reply message) are child's handlers --> IMMessageHandlers.
// 	// Will be triggered on 'manager-depleted' - will send in response a 'stop-endpoint'.
// 	const parentHandler: IHandlerFunction<CUMessageHandlers, IMMessageHandlers> = ({
// 		message, // This function requires a message.
// 		worker, // This function requires a worker, for worker.post().
// 	}) => {
// 		console.log('[conversing_d0][parentHandler] message: ', message);
// 		if (worker === undefined) {
// 			throw Error('[conversing_d0][parentHandler] worker is undefined');
// 		} else {
// 			if (!stop) {
// 				worker.postMessage({ handlerName: 'stop-endpoint' });
// 				stop = true;
// 			}
// 		}
// 	};

// 	// Add parent's handler-function to message-handler class.
// 	parentMHandler.addMessageHandler('manager-depleted', parentHandler);

// 	// Create the first child.
// 	const conversing_d1 = new IpManagementWorker(path.join(__dirname, 'conversing_d1.js'), {
// 		workerData: { proxyEndpoint: undefined },
// 	});

// 	// Add on-message event to the child, so parent can notice a 'manager-depleted'.
// 	conversing_d1.once('message', (message) =>
// 		parentMHandler.handle({
// 			message: message,
// 			worker: conversing_d1,
// 		})
// 	);

// 	// Send a 'start-endpoint' message to the first child.
// 	conversing_d1.postMessage(parentMessage);

// 	console.log('[conversing_d0] End');
// };
