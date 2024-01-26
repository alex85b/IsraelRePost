import { CUMessageHandlers } from '../../entry-point/ContinuesUpdateRoot';
import { IMMessageHandlers, IpMWorkerData } from '../../worker-scripts/IpManagerWorkerScript';
import { ACustomParentPort } from './ACustomParentPort';

export class ContinuesUpdatePPort extends ACustomParentPort<IMMessageHandlers, CUMessageHandlers> {
	// No custom constructor needed.

	extractData(workerData: IpMWorkerData) {
		if (workerData) {
			const proxyEndpoint = workerData.proxyEndpoint;
			if (proxyEndpoint && typeof proxyEndpoint !== 'string') {
				console.error(workerData);
				throw Error(
					'[ContinuesUpdatePPort][extractData] proxyEndpoint : exist and not string'
				);
			}
		}
		return workerData.proxyEndpoint;
	}
}
