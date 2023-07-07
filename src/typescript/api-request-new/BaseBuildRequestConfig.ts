import { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface IRequestConfigInput {
	[key: string]: string | { [key: string]: string | { [key: string]: string } };
}

export interface IRequestConfigData {
	url: IRequestConfigInput;
	headers: IRequestConfigInput; // can contain cookies.
	data: IRequestConfigInput;
	useProxy: boolean;
	proxyUrl: string;
	proxyAuth: { username: string; password: string };
}

export abstract class BaseBuildRequestConfig {
	protected configData: IRequestConfigData;
	constructor(configData: IRequestConfigData) {
		this.configData = configData;
	}

	protected baseConfig: AxiosRequestConfig<any> = {};

	buildAxiosRequestConfig(): AxiosRequestConfig {
		if (this.configData?.useProxy) {
			const proxyURL = new URL(this.configData?.proxyUrl);
			if (this.configData?.proxyAuth) {
				proxyURL.username = this.configData?.proxyAuth?.username;
				proxyURL.password = this.configData?.proxyAuth?.password;
			}
			const proxyAgent = new HttpsProxyAgent(proxyURL.toString());
			this.baseConfig.httpsAgent = proxyAgent;
		}
		return this.baseConfig;
	}

	protected reformatCookiesForAxios(cookies: { [key: string]: string }) {
		const responseArray: string[] = [];
		for (const cookie in cookies) {
			responseArray.push(`${String(cookie)}=${cookies[cookie]}`);
		}
		return responseArray.join(' ');
	}
}
