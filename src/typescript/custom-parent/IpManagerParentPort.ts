import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomParentPort } from './ACustomParentPort';
import { IBUMessageHandlers } from '../scrape-multithreaded/BranchUpdater';
import { IBranchUpdaterWData } from '../custom-worker/BranchUpdaterWorker';

export class IpManagerParentPort extends ACustomParentPort<IBUMessageHandlers, IMMessageHandlers> {
	// No custom constructor needed.

	extractData(workerData: IBranchUpdaterWData) {
		const requestCounterBuffer = workerData.requestCounterBuffer;
		const requestsAllowedBuffer = workerData.requestsAllowedBuffer;
		if (!requestCounterBuffer || !requestsAllowedBuffer) {
			console.error(workerData);
			throw Error('[IpManagerParentPort] extractData: is not a valid IBranchUpdaterWData');
		}
		return workerData;
	}
}
