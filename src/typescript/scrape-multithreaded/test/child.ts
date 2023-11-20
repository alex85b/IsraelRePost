import { Worker, parentPort, MessagePort } from 'worker_threads';
import path from 'path';
import { myMessage } from './parent';

const listen = () => {
	const handler = new cHandler(parentPort!);
	parentPort?.on('message', (message: myMessage) => {
		handler.handlers[message.handlerName](message.handlerData[0]);
	});
};

export class cHandler {
	public handlers: { [key: string]: (arg0: any) => any } = {};
	constructor(private pePort: MessagePort) {
		this.handlers['A'] = (textToReturn: string) => {
			this.pePort.postMessage('textToReturn' + ' Handled');
		};
	}
}

listen();
