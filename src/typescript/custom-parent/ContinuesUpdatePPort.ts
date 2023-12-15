import { AxiosProxyConfig } from 'axios';
import { CUMessageHandlers } from '../scrape-multithreaded/ContinuesUpdate';
import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomParentPort } from './ACustomParentPort';

export class ContinuesUpdatePPort extends ACustomParentPort<IMMessageHandlers, CUMessageHandlers> {
	// No custom constructor needed.

	extractData(workerData: AxiosProxyConfig) {
		if (workerData) {
			const host = workerData.host;
			const port = workerData.port;
			const password = workerData.auth?.password;
			const username = workerData.auth?.username;
			if (!host || !port || !password || !username) {
				console.error(workerData);
				throw Error('[ContinuesUpdatePPort] extractData: is not a valid AxiosProxyConfig');
			}
			return workerData;
		}
		return null;
	}
}
