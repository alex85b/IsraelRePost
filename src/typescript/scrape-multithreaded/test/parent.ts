import { Worker } from 'worker_threads';
import path from 'path';

const worker: Worker = new Worker(path.join(__dirname, 'child.js'), {
	workerData: {},
});

worker.on('message', (message) => {
	console.log(message);
});

export interface myMessage {
	handlerName: string;
	handlerData: any[];
}

const m: myMessage = {
	handlerName: 'A',
	handlerData: ['this comes from parent'],
};

worker.postMessage(m);
