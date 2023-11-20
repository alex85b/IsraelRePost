import { CustomWorker } from '../CWorker';

// Define a Message object that will be passed between threads.
export interface IMessage<H extends string> {
	handlerName: H;
	handlerData?: any[];
}

// Define a set of arguments to pass to a 'Message Handler Function'.
// H is the handler of the message.
// WH are the handler names of the worker that is associated with the message.
export interface IMessageHFArguments<H extends string> {
	message: IMessage<H>;
	operationData: any; // Additional-unexpected data related to the operation
	cWorker: CustomWorker; // Custom worker associated with the message
}

// Define a signature of a 'Message Handler Function'.
export interface IMessageHandlerFunction<H extends string> {
	(data: IMessageHFArguments<H>): any; // Function signature for message handling
}

// Create a generic class that maps 'Message Handler Function' names to actual functions.
export class MessagesHandler<H extends string> {
	private functionMapping: Map<H, IMessageHandlerFunction<H>> = new Map();

	// Add a message handler function to the mapping
	addMessageHandler(handlerName: H, handler: IMessageHandlerFunction<H>) {
		this.functionMapping.set(handlerName, handler);
	}

	// Handle a message using the corresponding handler function
	handle(handlerArguments: IMessageHFArguments<H>) {
		const handler = this.functionMapping.get(handlerArguments.message.handlerName);
		if (handler) {
			return handler(handlerArguments); // Invoke the handler function
		} else {
			return null; // No handler found for the given handlerName
		}
	}
}
