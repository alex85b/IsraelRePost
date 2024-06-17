// import { Worker } from 'worker_threads';
// import path from 'path';
// import {
// 	IArrayCounterSetup,
// 	NaturalNumbersArraySetup,
// } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
// import {
// 	BoundaryAwareIncrementalCounter,
// 	IBoundaryAwareCounter,
// } from '../../../services/appointments-update/components/atomic-counter/BoundaryAwareCounter';
// import {
// 	ILimitRequests,
// 	LimitPerMinute,
// } from '../../../services/appointments-update/components/request-regulator/LimitRequests';

// const pokeWorkers = (workers: Worker[]) => {
// 	console.log(`[TestLimitRequests][pokeWorkers] Start`);
// 	for (const worker of workers) {
// 		console.log(`[TestLimitRequests][pokeWorkers] sends 'test' to Worker ${worker.threadId}`);
// 		worker.postMessage('test');
// 	}
// 	console.log(`[TestLimitRequests][pokeWorkers] End`);
// };

// export const testLimitPerMinuteThreaded = async (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Limit Per Minute Threaded] Start');

// 	const arrayCounterSetup_1: IArrayCounterSetup = new NaturalNumbersArraySetup({
// 		counterRangeAndLength: { bottom: 0, length: 2, top: 255 },
// 	});
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounterSetup_1] Created using {counterRangeAndLength: { bottom: 0, length: 2, top: 255 }}'
// 	);

// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounterSetup_1] setCellValue(5, 1) : ',
// 		arrayCounterSetup_1.setCellValue(5, 1)
// 	);

// 	const counterData = arrayCounterSetup_1.getCounterData();
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounterSetup_1] counterData : ',
// 		counterData
// 	);

// 	const arrayCounterSetup_2: IArrayCounterSetup = new NaturalNumbersArraySetup({
// 		readyData: counterData,
// 	});
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounterSetup_2] Created using counterData : ',
// 		counterData
// 	);

// 	const arrayCounter_1: IBoundaryAwareCounter = new BoundaryAwareIncrementalCounter(
// 		arrayCounterSetup_1
// 	);
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounter_1] Created using arrayCounterSetup_1'
// 	);
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounter_1] Will be used to set values at the Parent'
// 	);

// 	const arrayCounter_2: IBoundaryAwareCounter = new BoundaryAwareIncrementalCounter(
// 		arrayCounterSetup_2
// 	);
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounter_2] Created using arrayCounterSetup_2'
// 	);
// 	console.log(
// 		'[Test Limit Per Minute Threaded][arrayCounter_2] Will be used for generating CounterData to pass to workers'
// 	);
// 	console.log('[Test Limit Per Minute Threaded] All counters have to target the same memory');

// 	let handledDepleted = false;

// 	const workers: Worker[] = [];
// 	const onlinePromises: Promise<void>[] = [];
// 	console.log('[Test Limit Per Minute Threaded] Created Worker[] and Promise<void>[]');

// 	const workerData = { counterData: arrayCounterSetup_2.getCounterData() };
// 	console.log(
// 		'[Test Limit Per Minute Threaded] workerData - { counterData: arrayCounterSetup_2.getCounterData() } : ',
// 		workerData
// 	);

// 	for (let i = 0; i < 10; i++) {
// 		const worker = new Worker(path.join(__dirname, 'ConsumerStub.js'), {
// 			workerData,
// 		});

// 		worker.once('message', async (message) => {
// 			console.log(
// 				`[Test Limit Per Minute Threaded][Worker ${worker.threadId}] message: `,
// 				message
// 			);
// 			if (typeof message == 'string' && message == 'request') {
// 			}
// 			if (typeof message == 'string' && message == 'depleted') {
// 				if (!handledDepleted) {
// 					handledDepleted = true;
// 					await new Promise<void>((resolve) => {
// 						setTimeout(() => {
// 							console.log(
// 								`[Test Limit Per Minute Threaded][Worker ${worker.threadId}] arrayCounterSetup_1.setCellValue(255, 0) : `,
// 								arrayCounterSetup_1.setCellValue(255, 0)
// 							);
// 							pokeWorkers(workers);
// 							resolve();
// 						}, 3000);
// 					});
// 				}
// 			}
// 		});

// 		workers.push(worker);
// 		onlinePromises.push(
// 			new Promise((resolve) => {
// 				worker.on('online', () => resolve());
// 			})
// 		);
// 		console.log(`[Test Limit Per Minute Threaded] new Worker ${worker.threadId}`);
// 	}

// 	await Promise.all(onlinePromises);
// 	console.log('[Test Limit Per Minute Threaded] All workers online');

// 	pokeWorkers(workers);

// 	console.log('[Test Limit Per Minute Threaded] End');
// };

// export const testLimitPerMinute = async (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Limit Per Minute] Start');

// 	const requestLimiter: ILimitRequests = new LimitPerMinute(
// 		new NaturalNumbersArraySetup({
// 			counterRangeAndLength: { bottom: 0, length: 2, top: 255 },
// 		})
// 	);

// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.setRequestsLimit(41) : ',
// 		requestLimiter.setRequestsLimit(41)
// 	);
// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.getLastValues() : ',
// 		requestLimiter.getLastValues()
// 	);

// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.isAllowed() : ',
// 		requestLimiter.isAllowed()
// 	);
// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.getLastValues() : ',
// 		requestLimiter.getLastValues()
// 	);

// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.isAllowed() : ',
// 		requestLimiter.isAllowed()
// 	);
// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.getLastValues() : ',
// 		requestLimiter.getLastValues()
// 	);

// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.isAllowed() : ',
// 		requestLimiter.isAllowed()
// 	);
// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.getLastValues() : ',
// 		requestLimiter.getLastValues()
// 	);

// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.isAllowed() : ',
// 		requestLimiter.isAllowed()
// 	);
// 	console.log(
// 		'[Test Limit Per Minute] requestLimiter.getLastValues() : ',
// 		requestLimiter.getLastValues()
// 	);

// 	console.log('[Test Limit Per Minute] End');
// };
