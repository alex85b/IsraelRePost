import { parentPort, threadId, workerData } from 'worker_threads';
import { NaturalNumbersCounterSetup } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
import {
	CountAPIRequest,
	ICountRequest,
} from '../../../services/appointments-update/components/atomic-counter/CountRequest';

// Setup
if (!workerData) throw Error(`[ConsumerStub ${threadId ?? 'no-id'}] workerData is undefined`);
const { counterData } = workerData;
if (!counterData) throw Error(`[ConsumerStub ${threadId ?? 'no-id'}] counterSetup is undefined`);
if (!parentPort) throw Error(`[Consumer Stub: ${threadId}] parentPort is Undefined`);

const counterSetup = new NaturalNumbersCounterSetup({
	readyData: counterData,
});

const countAPIRequest: ICountRequest = new CountAPIRequest(counterSetup);

parentPort.on('message', (message) => {
	console.log(`[Consumer Stub: ${threadId}] message: `, message);

	if (typeof message == 'string' && message == 'test') {
		const result = countAPIRequest.isAllowed(5);
		console.log(
			`[ConsumerStub ${threadId ?? 'no-id'}] countAPIRequest.isAllowed(5) : `,
			result
		);
		if (result.allowed) parentPort!.postMessage('request');
		else parentPort!.postMessage('depleted');
	}
});
