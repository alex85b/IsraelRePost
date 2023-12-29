import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomParentPort } from './ACustomParentPort';
import { IBUMessageHandlers, IBranchUpdaterWData } from '../scrape-multithreaded/BranchUpdater';

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
