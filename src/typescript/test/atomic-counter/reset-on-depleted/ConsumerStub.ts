import { parentPort, threadId, workerData } from 'worker_threads';
import { NaturalNumbersCounterSetup } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
import {
	IIncrementalCounter,
	NaturalNumbersCounter,
} from '../../../services/appointments-update/components/atomic-counter/IncrementalCounter';

// Setup
if (!workerData) throw Error(`[ConsumerStub ${threadId ?? 'no-id'}] workerData is undefined`);
const { counterData } = workerData;
// console.log(`[ConsumerStub ${threadId ?? 'no-id'}] counterSetup : `, counterData);
if (!counterData) throw Error(`[ConsumerStub ${threadId ?? 'no-id'}] counterSetup is undefined`);
if (!parentPort) throw Error(`[Consumer Stub: ${threadId}] parentPort is Undefined`);

const counterSetup = new NaturalNumbersCounterSetup({
	readyData: counterData,
});
const countNaturalNumbers: IIncrementalCounter = new NaturalNumbersCounter(counterSetup);

parentPort.on('message', (message) => {
	console.log(`[Consumer Stub: ${threadId}] message: `, message);

	if (typeof message == 'string' && message == 'test') {
		const result = countNaturalNumbers.increment();
		console.log(
			`[ConsumerStub ${threadId ?? 'no-id'}] countNaturalNumbers.increment : `,
			result
		);
		if (result.value < 6) parentPort!.postMessage('request');
		else parentPort!.postMessage('depleted');
	}
});
