import { AbstractCustomWorker } from '../components/custom-worker/AbstractCustomWorker';
import { ACustomParentPort } from '../components/custom-parent/ACustomParentPort';

export interface IMessage<H extends string> {
	handlerName: H;
	messageData?: any[];
}

export interface IHandlerData<TH extends string, SH extends string> {
	message: IMessage<TH>;
	worker?: AbstractCustomWorker<SH, TH>;
	parentPort?: ACustomParentPort<TH, SH>;
}

export interface IHandlerFunction<TH extends string, SH extends string> {
	(data: IHandlerData<TH, SH>): any;
}

// TH: Target Handler, the target handler-function name.
// SH: Source Handler, the source handler-function name.
export class MessagesHandler<TH extends string> {
	private functionMapping: Map<TH, IHandlerFunction<TH, any>> = new Map();

	addMessageHandler<SH extends string>(handlerName: TH, handler: IHandlerFunction<TH, SH>) {
		this.functionMapping.set(handlerName, handler);
	}

	handle<SH extends string>(data: IHandlerData<TH, SH>) {
		const handler = this.functionMapping.get(data.message.handlerName);
		if (handler) {
			return handler(data);
		} else {
			throw Error(
				`[MessagesHandler][handle] unknown handler-name: ${data.message.handlerName}`
			);
		}
	}
}
