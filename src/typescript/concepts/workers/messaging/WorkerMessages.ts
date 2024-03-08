import { ACustomParentPort } from '../../../services/appointments-update/components/custom-parent/ACustomParentPort';
import { AbstractCustomWorker } from '../../../services/appointments-update/components/custom-worker/AbstractCustomWorker';
import { AppointmentsUpdatersObject } from '../logic/IpManagerMessageHandler';

export type WorkerMessage<H extends string> = {
	handlerName: H;
	messageData?: any[];
};

export type HandlerData<TH extends string, SH extends string> = {
	message: WorkerMessage<TH>;
	worker?: AbstractCustomWorker<SH, TH>;
	parentPort?: ACustomParentPort<TH, SH>;
};

export type HandlerFunctionOutput<SH extends string> = Promise<
	SH | AppointmentsUpdatersObject | undefined
> | void;

export type HandlerFunction<TH extends string, SH extends string> = (
	data: HandlerData<TH, SH>
) => HandlerFunctionOutput<SH>;

export type HandlerFunctionCollection<TH extends string, SH extends string> = {
	[key in TH]: HandlerFunction<TH, SH> | undefined;
};

interface IMessagesHandler<TH extends string, SH extends string> {
	handle(data: HandlerData<TH, SH>): HandlerFunctionOutput<SH>;
}

// TH: Target Handler, the target handler-function name.
// SH: Source Handler, the source handler-function name.
export abstract class MessagesHandler<TH extends string, SH extends string>
	implements IMessagesHandler<TH, SH>
{
	// protected abstract functionMapping: Map<TH, HandlerFunction<TH, any>>;
	protected abstract functionCollection: HandlerFunctionCollection<TH, SH>;

	addMessageHandler(handlerName: TH, handler: HandlerFunction<TH, SH>) {
		this.functionCollection[handlerName] = handler;
	}

	handle(data: HandlerData<TH, SH>) {
		const handler = this.functionCollection[data.message.handlerName];
		if (handler) {
			return handler(data);
		} else {
			throw Error(
				`[MessagesHandler][handle] unknown handler-name: ${data.message.handlerName}`
			);
		}
	}
}
