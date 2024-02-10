import { Mutex } from 'async-mutex';
import { Worker } from 'worker_threads';
import path from 'path';

const mu = new Mutex();
let sharedCounter = 0;

const critical = async (threadId: number) => {
	await new Promise<void>((resolve) => {
		setTimeout(() => {
			console.log(
				`[Test Mutex Counter][Worker ${threadId}][mu.acquire] sharedCounter: ${sharedCounter}`
			);
			sharedCounter++;
			resolve();
		}, 3000);
	});
};

export const testMutexCounter = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Mutex Counter] Start');

	const workers: Worker[] = [];
	const onlinePromises: Promise<void>[] = [];
	console.log('[Test Mutex Counter] Created Worker[] and Promise<void>[]');

	for (let i = 0; i < 3; i++) {
		const worker = new Worker(path.join(__dirname, 'ConsumerStub.js'));
		worker.once('message', async (message) => {
			console.log(`[Test Mutex Counter][Worker ${worker.threadId}] message: `, message);
			if (typeof message == 'string' && message == 'request') {
				await mu.acquire().then(async (release) => {
					await critical(worker.threadId);
					release();
				});
			}
		});

		workers.push(worker);
		onlinePromises.push(
			new Promise((resolve) => {
				worker.on('online', () => resolve());
			})
		);
		console.log(`[Test Mutex Counter] new Worker ${worker.threadId}`);
	}

	await Promise.all(onlinePromises);
	console.log('[Test Mutex Counter] All workers online');

	for (const worker of workers) {
		console.log(`[Test Mutex Counter] sends 'test' to Worker ${worker.threadId}`);
		worker.postMessage('test');
	}
	console.log('[Test Mutex Counter] End');
};
