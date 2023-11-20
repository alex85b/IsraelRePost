import fs from 'fs';
import * as readline from 'readline';

export abstract class ProxyCollection {
	abstract getProxyObject(): Promise<IProxyIP>;

	protected async generateEndpointsFromFile(filePath: string) {
		const endpointPortObjects: IEndpoint[] = [];
		const fileStream = fs.createReadStream(filePath);

		// Setup read line rules.
		const rl = readline.createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		});

		// Setup a line event - this will happen for each line.
		rl.on('line', (line) => {
			const [endpoint, port] = line.split(':');
			endpointPortObjects.push({ endPoint: endpoint, port: port });
		});

		/**
		 * Encapsulate a 'close' file event in a Promise.
		 * This will happen on file closure.
		 * Returns an IEndpoint.
		 */
		return new Promise<IEndpoint[]>((resolve) => {
			rl.on('close', () => {
				resolve(endpointPortObjects);
			});
		});
	}

	protected readProxyAuth(envUsername: string, envPassword: string): IProxyAuth {
		const username = process.env[envUsername] ?? '';
		const password = process.env[envPassword] ?? '';
		if (username == '' || password == '') {
			throw new Error(
				`[Read Smart Proxy Auth][Error][Username: ${username}][Password: ${password}]`
			);
		}
		return { password: password, userName: username };
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################/

export interface IProxyIP {
	userName: string;
	password: string;
	endpoints: IEndpoint[];
}

export interface IEndpoint {
	endPoint: string;
	port: string;
}

export interface IProxyAuth {
	userName: string;
	password: string;
}
