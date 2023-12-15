import { AxiosProxyConfig } from 'axios';
import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomWorker } from './ACustomWorker';
import { IBUMessageHandlers } from '../scrape-multithreaded/BranchUpdater';

export class BranchUpdaterWorker extends ACustomWorker<IBUMessageHandlers, IMMessageHandlers> {
	constructor(filename: string | URL, options: IBranchUpdaterWOptions) {
		super(filename, options);
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IBranchUpdaterWOptions extends WorkerOptions {
	workerData?: IBranchUpdaterWData;
}

export interface IBranchUpdaterWData {
	axiosProxyConfig?: AxiosProxyConfig;
	requestsAllowedBuffer: SharedArrayBuffer;
	requestCounterBuffer: SharedArrayBuffer;
}
