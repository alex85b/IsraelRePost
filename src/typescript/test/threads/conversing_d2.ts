import {
	IHandlerFunction,
	IMessage,
	MessagesHandler,
} from '../../services/appointments-update/worker-messaging/HandleThreadMessages';
import path from 'path';
import { parentPort } from 'worker_threads';
import { CUMessageHandlers } from '../../services/appointments-update/entry-point/ContinuesUpdateRoot';
import { IMMessageHandlers } from '../../services/appointments-update/worker-scripts/IpManagerWorkerScript';
import { ContinuesUpdatePPort } from '../../services/appointments-update/components/custom-parent/ContinuesUpdatePPort';
import { IpManagerParentPort } from '../../services/appointments-update/components/custom-parent/IpManagerParentPort';

if (parentPort === undefined) throw Error('[conversing_d1] parentPort is undefined');
if (parentPort === null) throw Error('[conversing_d1] parentPort is null');

// Will run passively.
const runConversing = () => {
	console.log('[conversing_d2] Start');

	// Construct a wrapper for parentPort.
	const ipManagerPort = new IpManagerParentPort(parentPort!);

	// Listen to parent.
	ipManagerPort?.on('message', (message) => {
		console.log('[conversing_d2][parentPort] message : ', message);
	});

	console.log('[conversing_d2] End');
};

runConversing();
