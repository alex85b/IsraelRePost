import { AxiosProxyConfig } from 'axios';
import { CUMessageHandlers } from '../scrape-multithreaded/ContinuesUpdate';
import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomWorker } from './ACustomWorker';

export class IpManagementWorker extends ACustomWorker<IMMessageHandlers, CUMessageHandlers> {
	constructor(filename: string | URL, options: IIpManagerWData) {
		super(filename, options);
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

interface IIpManagerWData extends WorkerOptions {
	workerData?: AxiosProxyConfig;
}
