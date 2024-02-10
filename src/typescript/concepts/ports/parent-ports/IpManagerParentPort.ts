import { ACustomParentPort } from '../../../services/appointments-update/components/custom-parent/ACustomParentPort';
import { IBranchUpdaterWData } from '../../../services/appointments-update/worker-scripts/AppointmentsWorkerScript';
import { AppointmentsMessageHandlers } from '../../workers/logic/AppointmentsMessageHandler';
import { IpManagerMessageHandlers } from '../../workers/logic/IpManagerMessageHandler';

export class IpManagerParentPort extends ACustomParentPort<
	AppointmentsMessageHandlers,
	IpManagerMessageHandlers
> {
	// No custom constructor needed.

	extractData(workerData: IBranchUpdaterWData) {
		const requestCounterData = workerData.counterData;
		if (!requestCounterData) {
			console.error(workerData);
			throw Error('[IpManagerParentPort] extractData: is not a valid IBranchUpdaterWData');
		}
		return workerData;
	}
}
