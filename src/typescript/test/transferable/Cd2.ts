import { workerData, Worker } from 'worker_threads';
import path from 'path';
import { RequestsAllowed } from '../../atomic-counter/RequestsAllowed';

const memoryBuffer = workerData.memoryBuffer as SharedArrayBuffer;

console.log('Cd2 - memoryBuffer : ', memoryBuffer);
const requestsAllowed = new RequestsAllowed({ arrayBuffer: memoryBuffer });
console.log('Cd2 - subtractAndGet : ', requestsAllowed.isAllowed());
console.log('Cd2 - subtractAndGet : ', requestsAllowed.isAllowed());
console.log('Cd2 - subtractAndGet : ', requestsAllowed.isAllowed());
console.log('Cd2 - subtractAndGet : ', requestsAllowed.isAllowed());
console.log('Cd2 - subtractAndGet : ', requestsAllowed.isAllowed());
