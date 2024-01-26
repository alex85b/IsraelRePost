// ################################################################################################
// ### Class ######################################################################################
// ################################################################################################

import { ProxyEndpoint } from '../../../data/proxy-management/ProxyCollection';
import { HandlerFunctionCollection, MessagesHandler } from '../messaging/WorkerMessages';
import { AppointmentsMessageHandlers } from './AppointmentsMessageHandler';

export class IpManagerMessageHandler extends MessagesHandler<
	IpManagerWorkerHandlers,
	AppointmentsMessageHandlers
> {
	protected functionCollection: HandlerFunctionCollection<
		IpManagerWorkerHandlers,
		AppointmentsMessageHandlers
	> = {
		'start-endpoint': undefined,
		'stop-endpoint': undefined,
		'updater-depleted': undefined,
		'updater-done': undefined,
	};
}

// ################################################################################################
// ### Types ######################################################################################
// ################################################################################################

export type IpManagerWorkerData = {
	proxyEndpoint: ProxyEndpoint | undefined;
	thisWorkerID: number;
};

export type IpManagerWorkerHandlers =
	| 'start-endpoint'
	| 'stop-endpoint'
	| 'updater-done'
	| 'updater-depleted';
