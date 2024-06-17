// import { NaturalNumbersArraySetup } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
// import { ResetLimitPerMinute } from '../../../services/appointments-update/components/request-regulator/ResetRequestLimiter';
// import { Worker } from 'worker_threads';
// import path from 'path';

// const setup = () => {
// 	const counterSetup = new NaturalNumbersArraySetup({
// 		counterRangeAndLength: { bottom: 0, top: 250, length: 2 },
// 	});

// 	const verifyDepletedMessage = new ResetLimitPerMinute(counterSetup);

// 	return { counterSetup, verifyDepletedMessage };
// };

// export const testResetLimitPerMinute = async (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Reset Limit Per Minute] Start');

// 	const { counterSetup, verifyDepletedMessage } = setup();

// 	const workers: Worker[] = [];
// 	const onlinePromises: Promise<void>[] = [];
// 	console.log('[Test Reset Limit Per Minute] Created Worker[] and Promise<void>[]');

// 	for (let i = 0; i < 10; i++) {
// 		const worker = new Worker(path.join(__dirname, 'ConsumerStub.js'), {
// 			workerData: { counterData: counterSetup.getCounterData() },
// 		});
// 		worker.once('message', async (message) => {
// 			console.log(
// 				`[Test Reset Limit Per Minute][Worker ${worker.threadId}] message: `,
// 				message
// 			);
// 			if (typeof message == 'string' && message == 'request') {
// 			}
// 			if (typeof message == 'string' && message == 'depleted') {
// 				console.log(
// 					`[Test Count Consumed Batch][Worker ${worker.threadId}] .isValidDepleted() : `,
// 					verifyDepletedMessage.isValidDepleted()
// 				);
// 			}
// 		});

// 		workers.push(worker);
// 		onlinePromises.push(
// 			new Promise((resolve) => {
// 				worker.on('online', () => resolve());
// 			})
// 		);
// 		console.log(`[Test Reset Limit Per Minute] new Worker ${worker.threadId}`);
// 	}

// 	await Promise.all(onlinePromises);
// 	console.log('[Test Reset Limit Per Minute] All workers online');

// 	for (const worker of workers) {
// 		console.log(`[Test Count Consumed Batch] sends 'test' to Worker ${worker.threadId}`);
// 		worker.postMessage('test');
// 	}

// 	console.log('[Test Reset Limit Per Minute] End');
// };
