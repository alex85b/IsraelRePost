import { IProxyIP, ProxyCollection } from './ProxyCollection';
import path from 'path';

export class WebShareCollection extends ProxyCollection {
	constructor() {
		super();
	}

	async getProxyObject(): Promise<IProxyIP> {
		const smartProxyFilePath = path.join(__dirname, '..', '..', '..', 'WebShare.txt');
		const { password, userName } = this.readProxyAuth('PROX_WBSHA_USR', 'PROX_WBSHA_PAS');
		return {
			userName,
			password,
			endpoints: await this.generateEndpointsFromFile(smartProxyFilePath),
		};
	}
}
