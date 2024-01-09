import { MessagePort, TransferListItem } from 'worker_threads';
import { IMessage } from '../continues-update/messages/HandleThreadMessages';

/**
 * Abstract Custom Parent Port:
 * A custom abstract Wrapper of MessagePort,
 * Intended to replace ('worker_threads')'s 'parentPort'.
 * This enforces a transfer of specific type of messages.
 * Messages from a parent to the child worker will be of the WH (Worker Handler) type.
 * Messages from the worker to worker's parent will be of the PH (Parent Handler) type.
 * This should enforce specific messaging format From a worker to his parent.
 */

export abstract class ACustomParentPort<WH extends string, PH extends string> {
	constructor(private parentPort: MessagePort) {}

	// From a parent to its Childe Worker-threads massage handlers.
	on(event: 'message', listener: (value: IMessage<WH>) => void): this;
	on(event: 'close', listener: () => void): this;
	on(event: 'messageerror', listener: (error: Error) => void): this;
	on(event: string | symbol, listener: (...args: any[]) => void): this {
		// Call the original on method from the base Worker class
		this.parentPort.on(event, listener);

		// Return this instance for chaining
		return this;
	}

	once(event: 'close', listener: () => void): this;
	once(event: 'message', listener: (value: IMessage<WH>) => void): this;
	once(event: 'messageerror', listener: (error: Error) => void): this;
	once(event: string | symbol, listener: (...args: any[]) => void): this {
		// Call the original on method from the base Worker class
		this.parentPort.on(event, listener);

		// Return this instance for chaining
		return this;
	}

	postMessage(value: IMessage<PH>, transferList?: readonly TransferListItem[] | undefined): void {
		this.parentPort.postMessage(value, transferList);
	}
}
