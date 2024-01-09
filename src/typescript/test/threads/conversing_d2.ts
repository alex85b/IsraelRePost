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
import { IpManagerParentPort } from '../../custom-parent/IpManagerParentPort';

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
