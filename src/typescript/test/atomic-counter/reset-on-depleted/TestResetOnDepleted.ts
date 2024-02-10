import { NaturalNumbersCounterSetup } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
import { VerifyDepletedMessage } from '../../../services/appointments-update/components/atomic-counter/ResetOnDepleted';
import { Worker } from 'worker_threads';
import path from 'path';

const counterSetup = new NaturalNumbersCounterSetup({
	counterRange: { bottom: 0, top: 250 },
});

const verifyDepletedMessage = new VerifyDepletedMessage(counterSetup);

export const testVerifyDepletedMessage = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Verify Depleted Message] Start');

	const workers: Worker[] = [];
	const onlinePromises: Promise<void>[] = [];
	console.log('[Test Verify Depleted Message] Created Worker[] and Promise<void>[]');

	for (let i = 0; i < 10; i++) {
		const worker = new Worker(path.join(__dirname, 'ConsumerStub.js'), {
			workerData: { counterData: counterSetup.getCounterData() },
		});
		worker.once('message', async (message) => {
			console.log(
				`[Test Verify Depleted Message][Worker ${worker.threadId}] message: `,
				message
			);
			if (typeof message == 'string' && message == 'request') {
			}
			if (typeof message == 'string' && message == 'depleted') {
				console.log(
					`[Test Count Consumed Batch][Worker ${worker.threadId}] countConsumedBatch: `,
					verifyDepletedMessage.isValidDepleted(5)
				);
			}
		});

		workers.push(worker);
		onlinePromises.push(
			new Promise((resolve) => {
				worker.on('online', () => resolve());
			})
		);
		console.log(`[Test Verify Depleted Message] new Worker ${worker.threadId}`);
	}

	await Promise.all(onlinePromises);
	console.log('[Test Verify Depleted Message] All workers online');

	for (const worker of workers) {
		console.log(`[Test Count Consumed Batch] sends 'test' to Worker ${worker.threadId}`);
		worker.postMessage('test');
	}

	console.log('[Test Verify Depleted Message] End');
};
