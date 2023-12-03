import { AxiosProxyConfig } from 'axios';
import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomWorker } from './ACustomWorker';
import { IBUMessageHandlers } from '../scrape-multithreaded/BranchUpdater';

interface IBranchUpdaterWData extends WorkerOptions {
	workerData?: AxiosProxyConfig;
	requestsAllowed: SharedArrayBuffer;
	requestCounter: SharedArrayBuffer;
}

export class BranchUpdaterWorker extends ACustomWorker<IBUMessageHandlers, IMMessageHandlers> {
	constructor(filename: string | URL, options: IBranchUpdaterWData) {
		super(filename, options);
	}
}
