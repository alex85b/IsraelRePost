import axios, { AxiosError, AxiosResponse, AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IConfigBuildData {
	url: { [key: string]: string };
	headers: { [key: string]: string | { [key: string]: string } };
}

export interface IAxiosRequestSetup {
	timeout: number;
	useProxy: boolean;
	proxyUrl: string;
	proxyUsername: string;
	proxyPassword: string;
}

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

interface ICommonAxiosConfig extends AxiosRequestConfig {
	method: 'get';
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
}

export interface IAxiosResponseReport {
	data: { [key: string]: string };
	results: { [key: string]: string | number | boolean }[];
}

export interface IResponseGenerator<
	R extends IAxiosResponseReport,
	D extends IConfigBuildData,
	S extends IAxiosRequestSetup
> {
	makeAxiosRequest(data: S): Promise<boolean>;
	buildRequestConfig(data?: D): boolean;
	parseAPIResponse(): R | null;
	getError(): Error | null;
}

export abstract class BranchRequest<
	R extends IExpectedServerResponse,
	RE extends IAxiosResponseReport,
	D extends IConfigBuildData
> implements IResponseGenerator<RE, D, IAxiosRequestSetup>
{
	protected axiosResponse: AxiosResponse<R, ICommonAxiosConfig> | null = null;
	protected proxyUsername: string | null = null;
	protected proxyPassword: string | null = null;
	protected proxyUrl: string | null = null;
	protected proxyPort: string | null = null;
	protected proxyIsActive: string | null = null;
	protected error: Error | null = null;
	protected reasons: string[] = [];
	protected requestData: D | null = null;
	protected commonConfig: ICommonAxiosConfig = {
		method: 'get',
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
	};

	async makeAxiosRequest(data: IAxiosRequestSetup): Promise<boolean> {
		try {
			const { timeout } = data;
			const customAxios: AxiosInstance = axios.create({
				timeout: timeout,
			});
			if (data.useProxy) {
				customAxios.defaults.proxy = {
					auth: { username: data.proxyUsername, password: data.proxyPassword },
					host: data.proxyUrl,
					port: 0,
				};
				console.log();
			}
			this.axiosResponse = await customAxios.request<
				ICommonAxiosConfig,
				AxiosResponse<R, ICommonAxiosConfig>,
				AxiosResponse
			>(this.commonConfig);
			return true;
		} catch (error) {
			if (error instanceof AxiosError && error.response) {
				this.axiosResponse = error.response;
			}
			this.error = error as Error;
			this.reasons.push('Axios request failure');
			return false;
		}
	}

	abstract buildRequestConfig(data: D): boolean;

	abstract parseAPIResponse(): RE | null;

	protected reformatCookiesForAxios(cookies: { [key: string]: string }) {
		const responseArray: string[] = [];
		for (const cookie in cookies) {
			responseArray.push(`${String(cookie)}=${cookies[cookie]}`);
		}
		return responseArray.join(' ');
	}

	getError() {
		return this.error;
	}

	getReasons() {
		return this.reasons;
	}

	async generateResponse(
		configData: D,
		requestSetup: IAxiosRequestSetup,
		beforeRequest?: { id: number; callBack: (id: number) => Promise<void> }
	) {
		if (this.buildRequestConfig(configData)) {
			if (beforeRequest) {
				const before = await beforeRequest.callBack(beforeRequest.id);
			}
			if (await this.makeAxiosRequest(requestSetup)) {
				const responseReport = this.parseAPIResponse();
				if (responseReport) {
					return responseReport;
				} else {
					let axiosError: AxiosError | null = null;
					if (this.error) axiosError = this.error as AxiosError;
					console.error(
						'[generateResponse] : parseAPIResponse failed ',
						axiosError?.name,
						axiosError?.cause,
						axiosError?.code,
						axiosError?.status,
						axiosError?.message,
						this.reasons
					);
				}
			}
		}
		return null;
	}

	private readEnvironmentFile() {
		const proxyIsActive = process.env.PROX_ACT || '';
		const proxyPassword = process.env.PROX_PAS || '';
		const proxyUsername = process.env.PROX_USR || '';
		const proxyPort = process.env.PROX_SPORT || '';
		const proxyUrl = process.env.PROX_ENDP || '';

		const invalid: string[] = [];
		if (typeof proxyIsActive !== 'string') {
			invalid.push('useProxy is not a string');
		} else if (typeof proxyUrl !== 'string') {
			invalid.push('proxyUrl is not a string');
		} else if (typeof proxyPassword !== 'string') {
			invalid.push('proxy password is not a string');
		} else if (typeof proxyUsername !== 'string') {
			invalid.push('proxy username is not a string');
		} else if (typeof proxyPort !== 'string') {
			invalid.push('proxy port is not a string');
		}

		if (invalid.length > 0) {
			const invalidStringed = invalid.join(';');
			throw Error("Can't read environment file: " + invalidStringed);
		}

		this.proxyIsActive = proxyIsActive;
		this.proxyPassword = proxyPassword;
		this.proxyUsername = proxyUsername;
		this.proxyPort = proxyPort;
		this.proxyUrl = proxyUrl;
	}
}
