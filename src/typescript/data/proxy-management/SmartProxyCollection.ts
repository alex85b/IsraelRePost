import { ProxyEndpoints, ProxyCollection } from './ProxyCollection';
import path from 'path';

export class SmartProxyCollection extends ProxyCollection {
	// Custom constructor is not needed.

	async getProxyObject(): Promise<ProxyEndpoints> {
		const smartProxyFilePath = path.join(__dirname, '..', '..', '..', 'SmartProxy.txt');
		const { password, userName } = this.readProxyAuth('PROX_SMRT_USR', 'PROX_SMRT_PAS');
		const endpoints = await this.generateEndpointsFromFile(smartProxyFilePath);

		// http://< Username >:< Password >@< Endpoint >:< Port >
		const proxyEndpoints = endpoints.map(
			(e) => `http://${userName}:${password}@${e.endPoint}:${e.port}`
		);
		return proxyEndpoints ?? [];
	}
}
