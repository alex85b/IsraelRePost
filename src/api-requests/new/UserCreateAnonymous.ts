import { AxiosRequestConfig } from 'axios';
import { BaseApiRequest } from './BaseRequest';
import { BadApiResponse } from '../../errors/BadApiResponse';

export class UserCreateAnonymous extends BaseApiRequest {
	constructor() {
		super();

		this.responseCookieHeaders = [
			'CentralJWTCookie',
			'ARRAffinity',
			'ARRAffinitySameSite',
			'GCLB',
		];

		this.responseDataKeys = [
			'Success',
			'token',
			'username',
			'ErrorMessage',
			'Messages',
		];
	}

	protected buildRequest(): AxiosRequestConfig<any> {
		const request: AxiosRequestConfig<any> = {
			method: 'get',
			maxBodyLength: Infinity,
			url: 'https://central.qnomy.com/CentralAPI/UserCreateAnonymous',
			headers: {
				authority: 'central.qnomy.com',
				accept: 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'he-IL,he;q=0.9',
				'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
				'application-name': 'PostIL',
				authorization: 'JWT null',
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
			},
		};
		return request;
	}

	protected parseResponseData(data: any): { [key: string]: string } {
		if (!this.isApiResponse(data))
			throw new BadApiResponse({
				message: 'response does not conform in format',
				source: 'UserCreateAnonymous',
			});

		const transformed = this.transformResponse(data);
		return transformed;
	}

	private isApiResponse(data: any) {
		return (
			data?.Success !== undefined &&
			data?.Results?.token !== undefined &&
			data?.Results?.username !== undefined &&
			data?.Page !== undefined &&
			data?.ResultsPerPage !== undefined &&
			data?.TotalResults !== undefined &&
			data?.ErrorMessage !== undefined &&
			data?.ErrorNumber !== undefined &&
			data?.Messages !== undefined
		);
	}

	// private transformResponse(data: any) {
	// 	const transformed: { [key: string]: string } = {};

	// 	transformed['Success'] = data.Success.toString();
	// 	transformed['token'] = data.Results.token;
	// 	transformed['username'] = data.Results.username;
	// 	transformed['Page'] = data.Page.toString();
	// 	transformed['ResultsPerPage'] = data.ResultsPerPage.toString();
	// 	transformed['TotalResults'] = data.TotalResults.toString();
	// 	transformed['ErrorMessage'] = data.ErrorMessage || '';
	// 	transformed['ErrorNumber'] = data.ErrorNumber.toString();
	// 	transformed['Messages'] = data.Messages ? data.Messages.join(',') : '';

	// 	return transformed;
	// }
}