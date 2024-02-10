import { Worker } from 'worker_threads';
import path from 'path';
import { ConsumeRequestBatch } from '../../../services/appointments-update/components/critical-couner/CountConsumedBatch';

const consumeRequestBatch = new ConsumeRequestBatch(8, 3);

export const testCountConsumedBatch = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Count Consumed Batch] Start');

	const workers: Worker[] = [];
	const onlinePromises: Promise<void>[] = [];
	console.log('[Test Count Consumed Batch] Created Worker[] and Promise<void>[]');

	for (let i = 0; i < 15; i++) {
		const worker = new Worker(path.join(__dirname, 'ConsumerStub.js'));
		worker.once('message', async (message) => {
			console.log(
				`[Test Count Consumed Batch][Worker ${worker.threadId}] message: `,
				message
			);
			if (typeof message == 'string' && message == 'request') {
				console.log(
					`[Test Count Consumed Batch][Worker ${worker.threadId}] countConsumedBatch: `,
					await consumeRequestBatch.countConsumedBatch()
				);
			}
		});

		workers.push(worker);
		onlinePromises.push(
			new Promise((resolve) => {
				worker.on('online', () => resolve());
			})
		);
		console.log(`[Test Count Consumed Batch] new Worker ${worker.threadId}`);
	}

	await Promise.all(onlinePromises);
	console.log('[Test Count Consumed Batch] All workers online');

	for (const worker of workers) {
		console.log(`[Test Count Consumed Batch] sends 'test' to Worker ${worker.threadId}`);
		worker.postMessage('test');
	}
	console.log('[Test Count Consumed Batch] End');
};
