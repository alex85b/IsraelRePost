// import { TransferListItem, Worker, WorkerOptions } from 'worker_threads';
// import { IMessage } from './messages/HandleThreadMessages';

// // TH - Target Handlers, Handler functions for messages sent to 'CustomWorker'.
// // SH - Source Handlers, Handler functions for receiving messages from worker.

// export class CustomWorker extends Worker {
// 	constructor(scriptLocation: string, options?: WorkerOptions) {
// 		super(scriptLocation, options);
// 	}

// 	// postMessage<TH extends string>(value: IMessage<TH>): void {
// 	// 	super.postMessage(value);
// 	// }
// 	postMessage<TH extends string>(
// 		value: IMessage<TH>,
// 		transferList?: readonly TransferListItem[] | undefined
// 	): void {
// 		super.postMessage(value, transferList);
// 	}

// 	// ### This is my update
// 	on<SH extends string>(event: 'message', listener: (value: IMessage<SH>) => void): this;
// 	// ##################################################################
// 	on(event: 'error', listener: (err: Error) => void): this;
// 	on(event: 'exit', listener: (exitCode: number) => void): this;
// 	on(event: 'messageerror', listener: (error: Error) => void): this;
// 	on(event: 'online', listener: () => void): this;
// 	on(event: string | symbol, listener: (...args: any[]) => void): this {
// 		// Call the original on method from the base Worker class
// 		super.on(event, listener);

// 		// Return this instance for chaining
// 		return this;
// 	}

// 	// ### This is my update
// 	once<SH extends string>(event: 'message', listener: (value: IMessage<SH>) => void): this;
// 	// ##################################################################
// 	once(event: 'error', listener: (err: Error) => void): this;
// 	once(event: 'exit', listener: (exitCode: number) => void): this;
// 	once(event: 'messageerror', listener: (error: Error) => void): this;
// 	once(event: 'online', listener: () => void): this;
// 	once(event: string | symbol, listener: (...args: any[]) => void): this {
// 		// Call the original on method from the base Worker class
// 		super.on(event, listener);

// 		// Return this instance for chaining
// 		return this;
// 	}
// }
