import { IProxyIP, ProxyCollection } from './ProxyCollection';
import path from 'path';

export class SmartProxyCollection extends ProxyCollection {
	constructor() {
		super();
	}

	async getProxyObject(): Promise<IProxyIP> {
		const smartProxyFilePath = path.join(__dirname, '..', '..', '..', 'SmartProxy.txt');
		const { password, userName } = this.readProxyAuth('PROX_SMRT_USR', 'PROX_SMRT_PAS');
		return {
			userName,
			password,
			endpoints: await this.generateEndpointsFromFile(smartProxyFilePath),
		};
	}
}
