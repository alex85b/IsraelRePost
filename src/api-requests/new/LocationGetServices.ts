import { AxiosRequestConfig } from 'axios';
import { BaseApiRequest } from './BaseRequest';
import { BadApiResponse } from '../../errors/BadApiResponse';

export class LocationGetServices extends BaseApiRequest {
	constructor() {
		super();

		this.requestCookieHeaders = [
			'ARRAffinity',
			'ARRAffinitySameSite',
			'CentralJWTCookie',
			'GCLB',
		];

		this.requestHeadersKeys = ['token'];

		this.requestUrlAttributes = ['locationId', 'serviceTypeId'];

		this.responseDataKeys = [
			'Success',
			'Results',
			'TotalResults',
			'ErrorMessage',
		];
	}
	protected buildRequest(
		cookies: { [key: string]: string },
		urlAttribute: { [key: string]: string },
		headers: { [key: string]: string },
		data: { [key: string]: string }
	): AxiosRequestConfig<any> {
		return {
			method: 'get',
			maxBodyLength: Infinity,
			url:
				'https://central.qnomy.com/CentralAPI/LocationGetServices?locationId=' +
				urlAttribute['locationId'] +
				'&serviceTypeId=' +
				urlAttribute['serviceTypeId'],
			headers: {
				authority: 'central.qnomy.com',
				accept: 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'he-IL,he;q=0.9',
				'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
				'application-name': 'PostIL',
				authorization: 'JWT ' + headers['token'],
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
	}
	protected parseResponseData(data: any): { [key: string]: string } {
		if (!this.isApiResponse(data)) {
			throw new BadApiResponse({
				message: 'response does not conform in format',
				source: 'buildRequest',
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
			this.nestedResponse.push(data?.Results);

			const resultsConform =
				data?.Results[0].serviceId !== undefined &&
				data?.Results[0].serviceName !== undefined &&
				data?.Results[0].serviceDescription !== undefined &&
				data?.Results[0].ServiceTypeId !== undefined &&
				data?.Results[0].serviceTypeDescription !== undefined &&
				data?.Results[0].description !== undefined &&
				data?.Results[0].showStats !== undefined &&
				data?.Results[0].waitingTime !== undefined &&
				data?.Results[0].HasCalendarService !== undefined &&
				data?.Results[0].DynamicFormsEnabled !== undefined &&
				data?.Results[0].HasFIFOService !== undefined &&
				data?.Results[0].ExtRef !== undefined &&
				data?.Results[0].LocationId !== undefined;

			if (!resultsConform) return false;
		}

		//Nuter nested 'Results'
		data['Results'] = 'Nested Object, Stored in: this.nestedResponse';
		return true;
	}

	getResponseArray() {
		return this.nestedResponse;
	}
}

/*
{
    "Success": true,
    "Results": [
      {
        "serviceId": 702,
        "serviceName": "אשנב כל ",
        "serviceDescription": "",
        "ServiceTypeId": 25,
        "serviceTypeDescription": "",
        "description": "עד 10 שוברים לתור",
        "showStats": false,
        "waitingTime": 0,
        "HasCalendarService": true,
        "DynamicFormsEnabled": false,
        "HasFIFOService": false,
        "ExtRef": "1",
        "LocationId": 278
      },
      {
        "serviceId": 704,
        "serviceName": "מסירת דואר ללקוח",
        "serviceDescription": "",
        "ServiceTypeId": 25,
        "serviceTypeDescription": "",
        "description": "מסירת רשומים וחבילות ללקוח",
        "showStats": false,
        "waitingTime": 0,
        "HasCalendarService": true,
        "DynamicFormsEnabled": false,
        "HasFIFOService": false,
        "ExtRef": "2",
        "LocationId": 278
      }
    ],
    "Page": 0,
    "ResultsPerPage": 0,
    "TotalResults": 2,
    "ErrorMessage": null,
    "ErrorNumber": 0,
    "Messages": null
}
*/
