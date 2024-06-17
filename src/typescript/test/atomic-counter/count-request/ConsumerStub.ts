// import { parentPort, threadId, workerData } from 'worker_threads';
// import { NaturalNumbersArraySetup } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
// import {
// 	LimitPerMinute,
// 	ILimitRequests,
// } from '../../../services/appointments-update/components/request-regulator/LimitRequests';

// // Setup.
// if (!workerData) throw Error(`[ConsumerStub ${threadId ?? 'no-id'}] workerData is undefined`);
// const { counterData } = workerData;
// if (!counterData) throw Error(`[ConsumerStub ${threadId ?? 'no-id'}] counterSetup is undefined`);
// if (!parentPort) throw Error(`[Consumer Stub: ${threadId}] parentPort is Undefined`);

// // console.log(`[ConsumerStub ${threadId ?? 'no-id'}] counterData : `, counterData);

// const arrayCounterSetup = new NaturalNumbersArraySetup({ readyData: counterData });
// // console.log(`[ConsumerStub ${threadId ?? 'no-id'}] arrayCounterSetup : `, arrayCounterSetup);

// const requestLimiter: ILimitRequests = new LimitPerMinute(arrayCounterSetup);
// // console.log(`[ConsumerStub ${threadId ?? 'no-id'}] requestLimiter : `, requestLimiter);

// parentPort.on('message', (message) => {
// 	console.log(`[Consumer Stub: ${threadId}] message: `, message);

// 	if (typeof message == 'string' && message == 'test') {
// 		const result = requestLimiter.isAllowed();
// 		console.log(`[ConsumerStub ${threadId ?? 'no-id'}] requestLimiter.isAllowed : `, result);
// 		if (result.allowed) parentPort!.postMessage('request');
// 		else parentPort!.postMessage('depleted');
// 	}
// });
