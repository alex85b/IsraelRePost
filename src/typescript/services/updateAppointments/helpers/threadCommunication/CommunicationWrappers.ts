import { MessagePort, Worker } from 'worker_threads';
import { ThreadMessage } from './Messages';

export interface ICommunicationWrapper {
	sendMessage(message: ThreadMessage): void;
	setCallbacks(args: {
		onMessageCallback: (message: ThreadMessage) => void;
		onErrorCallback?: (error: Error) => void;
		onExitCallback?: (exitCode: number) => void;
	}): void;
}

export interface IIdentifiable {
	getID(): number;
}

export interface ITerminable {
	terminate(): Promise<number>;
}

export class ParentPortWrapper implements ICommunicationWrapper {
	private parentPort: MessagePort;

	constructor(buildData: { parentPort: MessagePort }) {
		this.parentPort = buildData.parentPort;
	}

	setCallbacks(args: { onMessageCallback: (message: ThreadMessage) => void }): void {
		this.parentPort.on('message', args.onMessageCallback);
	}

	sendMessage(message: ThreadMessage): void {
		this.parentPort.postMessage(message);
	}
}

export class WorkerWrapper implements ICommunicationWrapper, IIdentifiable, ITerminable {
	private worker: Worker;
	private id: number;

	constructor(buildData: { workerScript: string; workerData?: any }) {
		this.worker = new Worker(
			buildData.workerScript,
			buildData.workerData ? { workerData: buildData.workerData } : undefined
		);
		this.id = this.worker.threadId;
	}

	setCallbacks(args: {
		onMessageCallback: (message: ThreadMessage) => void;
		onErrorCallback?: ((error: Error) => void) | undefined;
		onExitCallback?: ((exitCode: number) => void) | undefined;
	}): void {
		this.worker.on('message', args.onMessageCallback);

		if (args.onErrorCallback) {
			this.worker.on('error', args.onErrorCallback);
		}

		if (args.onExitCallback) {
			this.worker.on('exit', args.onExitCallback);
		}
	}

	getID(): number {
		return this.id;
	}

	sendMessage(message: ThreadMessage) {
		this.worker.postMessage(message);
	}

	async terminate() {
		return await this.worker.terminate();
	}
}
