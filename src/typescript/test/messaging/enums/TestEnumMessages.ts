// import { Worker, WorkerOptions } from 'worker_threads';
// import * as path from 'path';
// import { AppointmentsUpdatingMessages } from '../../../concepts/communication/Messages';

// export const testEnumMessages = (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Enum Messages] Start');

// 	const messageConsumerStub = new Worker(path.join(__dirname, 'MessageConsumer.js'));
// 	messageConsumerStub.postMessage(AppointmentsUpdatingMessages.StartUpdates);
// 	console.log('[Test Enum Messages] End');
// };
