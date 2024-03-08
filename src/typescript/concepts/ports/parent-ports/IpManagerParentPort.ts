import { ACustomParentPort } from '../../../services/appointments-update/components/custom-parent/ACustomParentPort';
import { AppointmentsWorkerData } from '../../../services/appointments-update/worker-scripts/AppointmentsWorkerScript';
import { AppointmentsMessageHandlers } from '../../workers/logic/AppointmentsMessageHandler';
import { IpManagerMessageHandlers } from '../../workers/logic/IpManagerMessageHandler';

export class IpManagerParentPort extends ACustomParentPort<
	AppointmentsMessageHandlers,
	IpManagerMessageHandlers
> {
	// No custom constructor needed.

	extractData(workerData: AppointmentsWorkerData) {
		const requestCounterData = workerData.CounterData;
		if (!requestCounterData) {
			throw Error('[IpManagerParentPort] extractData: is not a valid AppointmentsWorkerData');
		}
		return workerData;
	}
}
