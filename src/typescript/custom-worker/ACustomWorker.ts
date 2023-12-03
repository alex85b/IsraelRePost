import { TransferListItem, Worker } from 'worker_threads';
import { IMessage } from '../scrape-multithreaded/messages/HandleThreadMessages';

/**
 * Abstract Custom Worker:
 * A custom abstract Worker-thread class that enforces transfer of specific messages.
 * Messages to the worker will be of the WH (Worker Handler) type.
 * Messages from the worker to worker's parent will be of the PH (Parent Handler) type.
 * This should enforce specific messaging format From parent to worker.
 */

export abstract class ACustomWorker<WH extends string, PH extends string> extends Worker {
	// custom constructor isn't needed.

	postMessage(value: IMessage<WH>, transferList?: readonly TransferListItem[] | undefined): void {
		super.postMessage(value, transferList);
	}

	// On messages from worker to its Parent's message handler.
	on(event: 'message', listener: (value: IMessage<PH>) => void): this;
	on(event: 'error', listener: (err: Error) => void): this;
	on(event: 'exit', listener: (exitCode: number) => void): this;
	on(event: 'messageerror', listener: (error: Error) => void): this;
	on(event: 'online', listener: () => void): this;
	on(event: string | symbol, listener: (...args: any[]) => void): this {
		// Call the original on method from the base Worker class
		super.on(event, listener);

		// Return this instance for chaining
		return this;
	}

	// On a message from worker to its Parent's message handler.
	once(event: 'message', listener: (value: IMessage<PH>) => void): this;
	once(event: 'error', listener: (err: Error) => void): this;
	once(event: 'exit', listener: (exitCode: number) => void): this;
	once(event: 'messageerror', listener: (error: Error) => void): this;
	once(event: 'online', listener: () => void): this;
	once(event: string | symbol, listener: (...args: any[]) => void): this {
		// Call the original on method from the base Worker class
		super.on(event, listener);

		// Return this instance for chaining
		return this;
	}
}
