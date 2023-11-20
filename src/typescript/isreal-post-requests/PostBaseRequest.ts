import axios, { AxiosError, AxiosResponse, AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IExpectedServerResponse {
	Success: boolean;
	Results: { [key: string]: any }[] | { [key: string]: any } | null;
	Page: number;
	ResultsPerPage: number;
	TotalResults: number;
	ErrorMessage: string | null;
	ErrorNumber: number;
	Messages: { [key: string]: any }[] | null;
}

export abstract class PostBaseRequest {
	protected customRequestConfig: CustomRequestConfig;

	constructor(
		timeout: number,
		proxy?: {
			proxyUsername: string;
			proxyPassword: string;
			proxyUrl: string;
			proxyPort: string;
		}
	) {
		this.customRequestConfig = new CustomRequestConfig(timeout);

		if (proxy) {
			this.customRequestConfig.setProxy(proxy);
		}
	}

	protected async israelPostRequest<SR extends IExpectedServerResponse>(
		axiosRequestConfig: AxiosRequestConfig
	) {
		const israelPostResponse = await axios.request<
			AxiosRequestConfig,
			AxiosResponse<SR, AxiosRequestConfig>,
			AxiosRequestConfig
		>(axiosRequestConfig);

		const status = israelPostResponse.status;
		const statusText = israelPostResponse.statusText;
		const responseData = israelPostResponse.data;
		const cookies = israelPostResponse.headers['set-cookie'];

		return {
			status: status,
			statusText: statusText,
			cookies: cookies,
			responseData: responseData,
		};
	}

	protected reformatCookiesForAxios(cookies: { [key: string]: string }) {
		const responseArray: string[] = [];
		for (const cookie in cookies) {
			responseArray.push(`${String(cookie)}=${cookies[cookie]}`);
		}
		return responseArray.join(' ');
	}

	protected getAxiosRequestConfig() {
		return this.customRequestConfig.getConfig();
	}
}

// ###################################################################################################
// ### Helper Class ##################################################################################
// ###################################################################################################

interface IProxy {
	proxyUsername: string;
	proxyPassword: string;
	proxyUrl: string;
	proxyPort: string;
}

// This is needed so every other class would know those keys exists.
interface IPostAxiosRequestConfig extends AxiosRequestConfig {
	method: 'GET';
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
	timeout: number;
}

class CustomRequestConfig {
	private axiosRequestConfig: IPostAxiosRequestConfig;
	constructor(timeout: number) {
		this.axiosRequestConfig = {
			method: 'GET',
			maxBodyLength: Infinity,
			headers: {
				authority: 'central.qnomy.com',
				accept: 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'he-IL,he;q=0.9',
				'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
				'application-name': 'PostIL',
				authorization: '',
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
			validateStatus: (status: number) => {
				// Prevents Errors on "Bad" Status.
				return true;
			},
			timeout: timeout,
		};
	}
	setProxy({ proxyUsername, proxyPassword, proxyUrl, proxyPort }: IProxy) {
		this.axiosRequestConfig.proxy = {
			auth: { username: proxyUsername, password: proxyPassword },
			host: proxyUrl,
			port: Number.parseInt(proxyPort),
		};
	}
	getConfig() {
		return { ...this.axiosRequestConfig } as IPostAxiosRequestConfig;
	}
}
