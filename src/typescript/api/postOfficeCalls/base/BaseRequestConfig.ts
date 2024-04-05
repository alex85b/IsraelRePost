import { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface IPostofficeRequestAxiosConfig extends AxiosRequestConfig {
	method: 'GET' | 'POST';
	maxBodyLength: number;
	headers: {
		authority: string;
		accept: string;
		'accept-language': string;
		'application-api-key': string;
		'application-name': string;
		authorization: string;
		origin: string;
		'sec-ch-ua': string;
		'sec-ch-ua-mobile': string;
		'sec-ch-ua-platform': string;
		'sec-fetch-dest': string;
		'sec-fetch-mode': string;
		'sec-fetch-site': string;
		'user-agent': string;
		Cookie: string;
	};
	validateStatus: (status: number) => boolean;
	withCredentials: true;
	maxRedirects: number;
	timeout: number;
	httpsAgent?: HttpsProxyAgent<string>;
}

export class BuildPostRequestAxiosConfig {
	private postofficeRequestConfig: IPostofficeRequestAxiosConfig;

	private constructor(postofficeRequestConfig: IPostofficeRequestAxiosConfig) {
		this.postofficeRequestConfig = postofficeRequestConfig;
	}

	getConfig() {
		return { ...this.postofficeRequestConfig } as IPostofficeRequestAxiosConfig;
	}

	static Builder = class PostofficeRequestConfigBuilder {
		private postofficeRequestConfig: IPostofficeRequestAxiosConfig;
		constructor() {
			this.postofficeRequestConfig = {
				method: 'GET',
				maxBodyLength: Infinity,
				baseURL: 'https://central.qnomy.com',
				headers: {
					authority: 'central.qnomy.com',
					accept: 'application/json, text/javascript, */*; q=0.01',
					'accept-language': 'he-IL,he;q=0.9',
					'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
					'application-name': 'PostIL',
					authorization: 'JWT null',
					origin: 'https://israelpost.co.il',
					'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': '"Windows"',
					'sec-fetch-dest': 'empty',
					'sec-fetch-mode': 'cors',
					'sec-fetch-site': 'cross-site',
					'user-agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
					Cookie: '',
				},
				validateStatus(status) {
					return true;
				},
				timeout: 120000,
				withCredentials: true,
				maxRedirects: 5,
				httpsAgent: undefined,
			};
		}

		requestMethod(data: { method: 'GET' | 'POST' }) {
			this.postofficeRequestConfig.method = data.method;
			return this;
		}

		requestBaseURL(data: { baseURL: string }) {
			this.postofficeRequestConfig.baseURL = data.baseURL;
			return this;
		}

		headerAuthority(data: { authority: string }) {
			this.postofficeRequestConfig.headers.authority = data.authority;
			return this;
		}

		headerApplicationApiKey(data: { apiKey: string }) {
			this.postofficeRequestConfig.headers['application-api-key'] = data.apiKey;
			return this;
		}

		headerAuthorization(data: { authorization: string }) {
			this.postofficeRequestConfig.headers.authorization = data.authorization;
			return this;
		}

		headerOrigin(data: { origin: string }) {
			this.postofficeRequestConfig.headers.origin = data.origin;
			return this;
		}

		headerCookies(data: { cookies: string }) {
			this.postofficeRequestConfig.headers.Cookie = data.cookies;
			return this;
		}

		paramsLocationId(data: { locationId: string }) {
			if (!this.postofficeRequestConfig.params) {
				this.postofficeRequestConfig.params = {};
			}
			this.postofficeRequestConfig.params['locationId'] = data.locationId;
			return this;
		}

		paramsServiceTypeId(data: { serviceTypeId: string }) {
			if (!this.postofficeRequestConfig.params) {
				this.postofficeRequestConfig.params = {};
			}
			this.postofficeRequestConfig.params['serviceTypeId'] = data.serviceTypeId;
			return this;
		}

		requestTimeout(data: { timeout: number }) {
			this.postofficeRequestConfig.timeout = data.timeout;
			return this;
		}

		requestMaxRedirects(data: { maxRedirects: number }) {
			this.postofficeRequestConfig.maxRedirects = data.maxRedirects;
			return this;
		}

		requestHttpsAgent(data: { httpsAgent: HttpsProxyAgent<string> }) {
			this.postofficeRequestConfig.httpsAgent = data.httpsAgent;
			return this;
		}

		requestUrl(data: { url: string }) {
			this.postofficeRequestConfig.url = data.url;
			return this;
		}

		build() {
			return new BuildPostRequestAxiosConfig(this.postofficeRequestConfig);
		}
	};
}
