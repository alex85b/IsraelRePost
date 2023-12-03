export interface IMessage<H extends string> {
	handlerName: H;
	handlerData?: any[];
}

export interface IMessageCallback<H extends string> {
	(message: IMessage<H>): any;
}

export interface IHandlerData<TH extends string, SH extends string> {
	message: IMessage<TH>;
	senderId?: string;
	messageCallback?: IMessageCallback<SH>;
}

export interface IHandlerFunction<TH extends string, SH extends string> {
	(data: IHandlerData<TH, SH>): any;
}

export class MessagesHandler<TH extends string> {
	private functionMapping: Map<TH, IHandlerFunction<any, any>> = new Map();

	addMessageHandler<SH extends string>(handlerName: TH, handler: IHandlerFunction<TH, SH>) {
		this.functionMapping.set(handlerName, handler);
	}

	handle<SH extends string>(message: IMessage<TH>, messageCallback?: IMessageCallback<SH>) {
		const handler = this.functionMapping.get(message.handlerName);
		if (handler) {
			return handler({ message, messageCallback });
		} else {
			return null;
		}
	}
}
