import { IMMessageHandlers } from '../../worker-scripts/IpManagerWorkerScript';
import { ACustomParentPort } from './ACustomParentPort';
import {
	IBUMessageHandlers,
	IBranchUpdaterWData,
} from '../../worker-scripts/AppointmentsWorkerScript';

export class IpManagerParentPort extends ACustomParentPort<IBUMessageHandlers, IMMessageHandlers> {
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
