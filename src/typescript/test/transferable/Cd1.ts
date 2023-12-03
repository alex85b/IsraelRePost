import { workerData, Worker } from 'worker_threads';
import path from 'path';
import { RequestsAllowed } from '../../atomic-counter/RequestsAllowed';

const memoryBuffer = workerData.memoryBuffer as SharedArrayBuffer;

console.log('Cd1 - memoryBuffer : ', memoryBuffer);
const requestsAllowed = new RequestsAllowed({ arrayBuffer: memoryBuffer });
console.log('Cd1 - subtractAndGet : ', requestsAllowed.isAllowed());

const cd2 = new Worker(path.join(__dirname, 'Cd2.js'), {
	workerData: { memoryBuffer: memoryBuffer },
});
