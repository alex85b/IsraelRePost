import { Worker } from 'worker_threads';
import path from 'path';
import { NaturalNumbersCounterSetup } from '../../../services/appointments-update/components/atomic-counter/CounterSetup';
import { NaturalNumbersCounter } from '../../../services/appointments-update/components/atomic-counter/IncrementalCounter';

// Those results are 'Good-enough' for my needs. In a case that in one iteration, a counter is flipped, there will be a run-away threads:
// A thread that was amongst the firsts and got the value -> 2, then before another iteration the counter has been flipped back and now said thread got the value 4,
// There will be no way for said thread to know that a flip has occurred, this can be solved by switching to mutex (don't want to force a wait), or
// Using a shared-memory cell as a flag that "the counter has been flipped",
// In my scenario there is no way that in one iteration the counter is flipped, i have a "low" amount of threads and a low "limit" of counting,
// In such a scenario is highly unlikely (famous last words) that a flip will occur on the first second or third iteration,
// And in such a case the lowest "in memory" value will be

const counterSetup = new NaturalNumbersCounterSetup({
	counterRange: { bottom: 0, top: 250 },
});

const naturalNumbersCounter = new NaturalNumbersCounter(counterSetup);

let handledDepleted = false;
const workers: Worker[] = [];

const pokeWorkers = () => {
	for (const worker of workers) {
		console.log(`[Test Count Consumed Batch] sends 'test' to Worker ${worker.threadId}`);
		worker.postMessage('test');
	}
};

export const testCountApiRequest = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Count Api Request] Start');

	const onlinePromises: Promise<void>[] = [];
	console.log('[Test Count Api Request] Created Worker[] and Promise<void>[]');

	for (let i = 0; i < 10; i++) {
		const worker = new Worker(path.join(__dirname, 'ConsumerStub.js'), {
			workerData: { counterData: counterSetup.getCounterData() },
		});
		worker.once('message', async (message) => {
			console.log(
				`[Test Count Consumed Batch][Worker ${worker.threadId}] message: `,
				message
			);
			if (typeof message == 'string' && message == 'request') {
			}
			if (typeof message == 'string' && message == 'depleted') {
				if (!handledDepleted) {
					handledDepleted = true;
					await new Promise((resolve) => {
						setTimeout(() => {
							console.log(
								`[Test Count Consumed Batch][Worker ${worker.threadId}] naturalNumbersCounter.reset(0) : `,
								naturalNumbersCounter.reset(naturalNumbersCounter.getLimits().max)
							);
							pokeWorkers();
						}, 3000);
					});
				}
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

	pokeWorkers();

	console.log('[Test Count Api Request] End');
};
