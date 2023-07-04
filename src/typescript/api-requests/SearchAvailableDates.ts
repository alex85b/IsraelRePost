import { AxiosRequestConfig } from 'axios';
import { BaseApiRequest } from './BaseRequest';
import { BadApiResponse } from '../errors/BadApiResponse';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class SearchAvailableDates extends BaseApiRequest {
	constructor() {
		super();
		this.requestCookieHeaders = ['ARRAffinity', 'ARRAffinitySameSite', 'GCLB'];
		this.requestUrlAttributes = ['serviceId', 'startDate'];
		this.requestHeadersKeys = ['token'];

		this.responseDataKeys = [
			'Success',
			'Results',
			'TotalResults',
			'ErrorMessage',
		];
		this.nameOfThis = 'SearchAvailableDates';
	}

	makeRequest(
		useProxy: boolean,
		proxyUrl: string,
		proxyAuth: { username: string; password: string },
		cookies: { ARRAffinity: string; ARRAffinitySameSite: string; GCLB: string },
		urlAttribute: { serviceId: string; startDate: string },
		headers: { token: string }
	): Promise<{
		data: {
			Success: string;
			Results: string;
			Page: string;
			TotalResults: string;
			ErrorMessage: string;
		};
		cookies: {};
		nested: { calendarDate: string; calendarId: string }[];
	}> {
		return super.makeRequest(
			useProxy,
			proxyUrl,
			proxyAuth,
			cookies,
			urlAttribute,
			headers
		) as Promise<{
			data: {
				Success: string;
				Results: string;
				Page: string;
				TotalResults: string;
				ErrorMessage: string;
			};
			cookies: {};
			nested: { calendarDate: string; calendarId: string }[];
		}>;
	}

	protected buildRequest(
		useProxy: boolean,
		proxyUrl: string,
		proxyAuth: { username: string; password: string },
		cookies: { ARRAffinity: string; ARRAffinitySameSite: string; GCLB: string },
		urlAttribute: { serviceId: string; startDate: string },
		headers: { token: string }
	): AxiosRequestConfig<any> {
		let writeDate = '';
		const { date } = this.getTodayDateObject();
		if (this.validateDateFormat(urlAttribute.startDate)) {
			writeDate = urlAttribute.startDate;
		} else {
			writeDate = date;
		}

		const requestConfig: AxiosRequestConfig<any> = {
			method: 'get',
			maxBodyLength: Infinity,
			url:
				'https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=30&serviceId=' +
				urlAttribute.serviceId +
				'&startDate=' +
				writeDate,
			headers: {
				authority: 'central.qnomy.com',
				accept: 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'he-IL,he;q=0.9',
				'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
				'application-name': 'PostIL',
				authorization: 'JWT ' + headers.token,
				origin: 'https://israelpost.co.il',
				'sec-ch-ua':
					'"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"Windows"',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'cross-site',
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
				Cookie: this.reformatForAxios(cookies),
			},
		};
		if (useProxy) {
			// console.log('[SearchAvailableDates] [buildRequest] useProxy: ', useProxy);
			const proxyURL = new URL(proxyUrl);
			if (proxyAuth) {
				proxyURL.username = proxyAuth.username;
				proxyURL.password = proxyAuth.password;
			}

			const proxyAgent = new HttpsProxyAgent(proxyURL.toString());
			requestConfig.httpsAgent = proxyAgent;
		}

		return requestConfig;
	}
	protected parseResponseData(data: any): { [key: string]: string } {
		if (!this.isApiResponse(data)) {
			console.error('[SearchAvailableDates] [parseResponseData] Error: ', {
				data: data,
				nested: this.nestedResponse,
			});
			throw new BadApiResponse({
				message: 'response does not conform in format',
				source: 'SearchAvailableDates',
			});
		}

		return this.transformResponse(data);
	}

	private isApiResponse(data: any) {
		const hasSameStructure =
			data?.Success !== undefined &&
			data?.Results !== undefined &&
			data?.Page !== undefined &&
			data?.ResultsPerPage !== undefined &&
			data?.TotalResults !== undefined &&
			data?.ErrorMessage !== undefined &&
			data?.ErrorNumber !== undefined &&
			data?.Messages !== undefined;

		// If isApiResponse has all the expected fields on the first level.
		if (!hasSameStructure) {
			console.error(
				'[SearchAvailableDates] [isApiResponse] hasSameStructure failed'
			);
			return false;
		}

		// If results is an array, that has second level, check results structure.
		if (data?.Results !== null) {
			if (Array.isArray(data?.Results)) {
				if (data?.Results.length > 0) {
					const resultsConform =
						data?.Results[0].calendarDate !== undefined &&
						data?.Results[0].calendarId !== undefined;

					if (!resultsConform) {
						console.error(
							'[SearchAvailableDates] [isApiResponse] resultsConform failed'
						);
						return false;
					}

					// Neuter nested 'Results'
					this.nestedResponse = data?.Results;
					data[
						'Results'
					] = `Nested Object, Stored in: ${this.nameOfThis}.this.nestedResponse`;
				}
			}
		}
		// Format is as expected.

		return true;
	}

	getResponseArray() {
		return this.nestedResponse;
	}
}

// const example = {
// 	Success: true,
// 	Results: [
// 		{
// 			calendarDate: '2023-06-26T00:00:00',
// 			calendarId: 1928269,
// 		},
// 		{
// 			calendarDate: '2023-06-27T00:00:00',
// 			calendarId: 1928687,
// 		},
// 		{
// 			calendarDate: '2023-06-28T00:00:00',
// 			calendarId: 1929099,
// 		},
// 		{
// 			calendarDate: '2023-06-29T00:00:00',
// 			calendarId: 1929509,
// 		},
// 	],
// 	Page: 0,
// 	ResultsPerPage: 0,
// 	TotalResults: 4,
// 	ErrorMessage: null,
// 	ErrorNumber: 0,
// 	Messages: [],
// };