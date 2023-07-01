import { AxiosRequestConfig } from 'axios';
import { BaseApiRequest } from './BaseRequest';
import { BadApiResponse } from '../errors/BadApiResponse';

export class SearchAvailableSlots extends BaseApiRequest {
	constructor() {
		super();
		this.nameOfThis = 'SearchAvailableSlots';
		this.requestCookieHeaders = ['ARRAffinity', 'ARRAffinitySameSite', 'GCLB'];
		this.requestHeadersKeys = ['token'];

		this.requestUrlAttributes = ['CalendarId', 'ServiceId', 'dayPart'];
		this.responseDataKeys = [
			'Success',
			'Results',
			'TotalResults',
			'ErrorMessage',
		];
	}

	makeRequest(
		cookies: { ARRAffinity: string; ARRAffinitySameSite: string; GCLB: string },
		urlAttribute: { CalendarId: string; ServiceId: string; dayPart: string },
		headers: { token: string }
	): Promise<{
		data: {
			Success: string;
			Results: string;
			Page: string;
			TotalResults: string;
			ErrorMessage: string;
		};
		cookies: { [key: string]: string };
		nested: { Time: string }[];
	}> {
		return super.makeRequest(cookies, urlAttribute, headers) as Promise<{
			data: {
				Success: string;
				Results: string;
				Page: string;
				TotalResults: string;
				ErrorMessage: string;
			};
			cookies: { [key: string]: string };
			nested: { Time: string }[];
		}>;
	}

	protected buildRequest(
		cookies: { ARRAffinity: string; ARRAffinitySameSite: string; GCLB: string },
		urlAttribute: { CalendarId: string; ServiceId: string; dayPart: string },
		headers: { token: string }
	): AxiosRequestConfig<any> {
		const apiRequest = {
			method: 'get',
			maxBodyLength: Infinity,
			url:
				'https://central.qnomy.com/CentralAPI/SearchAvailableSlots?CalendarId=' +
				urlAttribute.CalendarId +
				'&ServiceId=' +
				urlAttribute.ServiceId +
				'&dayPart=' +
				urlAttribute.dayPart,
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
		return apiRequest;
	}

	protected parseResponseData(data: any): { [key: string]: string } {
		if (!this.isApiResponse(data)) {
			console.error('[SearchAvailableSlots] [parseResponseData] Error: ', {
				data: data,
				nested: this.nestedResponse,
			});
			throw new BadApiResponse({
				message: 'response does not conform in format',
				source: 'SearchAvailableSlots',
			});
		}

		return this.transformResponse(data);
	}

	private isApiResponse(data: any) {
		const hasSameStructure =
			data?.Success !== undefined &&
			data?.Results !== undefined &&
			Array.isArray(data?.Results) &&
			data?.Page !== undefined &&
			data?.ResultsPerPage !== undefined &&
			data?.TotalResults !== undefined &&
			data?.ErrorMessage !== undefined &&
			data?.ErrorNumber !== undefined &&
			data?.Messages !== undefined;

		if (!hasSameStructure) return false;

		const hasManyResults = data.Results.length > 0;
		if (hasManyResults) {
			// Save nested response.
			this.nestedResponse = data.Results;

			const resultsConform = data?.Results[0].Time !== undefined;

			if (!resultsConform) return false;
		}

		// Neuter nested 'Results'
		data[
			'Results'
		] = `Nested Object, Stored in: ${this.nameOfThis}.this.nestedResponse`;
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
// 			Time: 485,
// 		},
// 		{
// 			Time: 490,
// 		},
// 		{
// 			Time: 495,
// 		},
// 		{
// 			Time: 505,
// 		},
// 		{
// 			Time: 510,
// 		},
// 		{
// 			Time: 515,
// 		},
// 		/*
//         ...
//         ...
//         ...
//         */
// 	],
// 	Page: 0,
// 	ResultsPerPage: 0,
// 	TotalResults: 30,
// 	ErrorMessage: null,
// 	ErrorNumber: 0,
// 	Messages: null,
// };
