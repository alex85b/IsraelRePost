import { Worker } from 'worker_threads';
import path from 'path';
import { RequestsAllowed } from '../../atomic-counter/RequestsAllowed';

const requestsAllowed = new RequestsAllowed({ allowedRequests: 300 });
const memoryBuffer = requestsAllowed.getMemoryBuffer();

console.log('P - sharedArr : ', memoryBuffer);
const cd1 = new Worker(path.join(__dirname, 'Cd1.js'), {
	workerData: { memoryBuffer: memoryBuffer },
});
