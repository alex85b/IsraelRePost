import { CUMessageHandlers } from '../scrape-multithreaded/ContinuesUpdate';
import { IMMessageHandlers, IpMWorkerData } from '../scrape-multithreaded/IpManager';
import { ACustomWorker } from './ACustomWorker';

export class IpManagementWorker extends ACustomWorker<IMMessageHandlers, CUMessageHandlers> {
	constructor(filename: string | URL, options: { workerData: IpMWorkerData }) {
		super(filename, options);
	}
}
