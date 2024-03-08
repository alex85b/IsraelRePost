import { parentPort, threadId } from 'worker_threads';

if (!parentPort) throw Error(`[Consumer Stub: ${threadId}] parentPort is Undefined`);

parentPort.on('message', (message) => {
	console.log(`[Consumer Stub: ${threadId}] message: `, message);

	if (typeof message == 'string' && message == 'test') {
		parentPort!.postMessage('request');
	}
});
