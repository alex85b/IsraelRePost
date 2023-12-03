import { AxiosProxyConfig } from 'axios';
import { CUMessageHandlers } from '../scrape-multithreaded/ContinuesUpdate';
import { IMMessageHandlers } from '../scrape-multithreaded/IpManager';
import { ACustomPPort } from './ACustomPPort';

export class ContinuesUpdatePPort extends ACustomPPort<IMMessageHandlers, CUMessageHandlers> {
	// No custom constructor needed.

	extractData(workerData: any) {
		if (workerData) {
			const host = workerData['host'];
			console.log(host);
			const port = workerData['port'];
			const password = workerData['auth']['password'];
			const username = workerData['auth']['username'];
			if (!host || !port || !password || !username) {
				console.error(workerData);
				throw Error('[ContinuesUpdatePPort] extractData: is not a valid AxiosProxyConfig');
			}
			const proxy: AxiosProxyConfig = {
				host,
				port,
				auth: { password, username },
			};
			return proxy;
		}
		return null;
	}
}
