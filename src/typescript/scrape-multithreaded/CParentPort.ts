import { MessagePort, TransferListItem, parentPort } from 'worker_threads';
import { IMessage } from './messages/HandleThreadMessages';

// PH - Parent Handlers, Message Handler functions of the parent.
// CH - Childe Handlers, Message Handler functions of the child.

export class CustomMessagePort {
	constructor(private parentPort: MessagePort) {}

	on(event: 'close', listener: () => void): this;
	on<CH extends string>(event: 'message', listener: (value: IMessage<CH>) => void): this;
	on(event: 'messageerror', listener: (error: Error) => void): this;
	on(event: string | symbol, listener: (...args: any[]) => void): this {
		// Call the original on method from the base Worker class
		this.parentPort.on(event, listener);

		// Return this instance for chaining
		return this;
	}

	once(event: 'close', listener: () => void): this;
	once<CH extends string>(event: 'message', listener: (value: IMessage<CH>) => void): this;
	once(event: 'messageerror', listener: (error: Error) => void): this;
	once(event: string | symbol, listener: (...args: any[]) => void): this {
		// Call the original on method from the base Worker class
		this.parentPort.on(event, listener);

		// Return this instance for chaining
		return this;
	}

	postMessage<PH extends string>(
		value: IMessage<PH>,
		transferList?: readonly TransferListItem[] | undefined
	): void {
		this.parentPort.postMessage(value, transferList);
	}
}
