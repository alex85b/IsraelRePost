import { ProxyEndpoints, ProxyCollection } from './ProxyCollection';
import path from 'path';

export class WebShareCollection extends ProxyCollection {
	// Custom constructor is not needed.

	async getProxyObject(): Promise<ProxyEndpoints> {
		const webShareFilePath = path.join(__dirname, '..', '..', '..', '..', 'WebShare.txt');
		const { password, userName } = this.readProxyAuth('PROX_WBSHA_USR', 'PROX_WBSHA_PAS');
		const endpoints = await this.generateEndpointsFromFile(webShareFilePath);

		// http://< Username >:< Password >@< Endpoint >:< Port >
		const proxyEndpoints = endpoints.map(
			(e) => `http://${userName}:${password}@${e.endPoint}:${e.port}`
		);
		return proxyEndpoints ?? [];
	}
}
