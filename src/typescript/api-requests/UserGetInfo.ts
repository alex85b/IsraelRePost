import { AxiosRequestConfig } from 'axios';
import { BaseApiRequest } from './BaseRequest';
import { BadApiResponse } from '../errors/BadApiResponse';

export class UserGetInfo extends BaseApiRequest {
	constructor() {
		super();

		this.requestCookieHeaders = [
			'ARRAffinity',
			'ARRAffinitySameSite',
			'CentralJWTCookie', //CentralJWTCookie=jwt=
			'GCLB',
		];

		this.requestHeadersKeys = ['token'];

		this.responseDataKeys = [
			'Success',
			'username',
			'isAnonymous',
			'isExternalLogin',
			'hasSingleActiveVisitToday',
			'hasMultipleVisits',
			'visitsCount',
			'hasActiveVisits',
			'visitId',
			'smsNotificationsEnabled',
			'smsVerified',
			'token',
			'ErrorMessage',
			'ErrorNumber',
			'Messages',
		];

		this.nameOfThis = 'UserGetInfo';
	}

	makeRequest(
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		},
		headers: { token: string }
	): Promise<{
		data: {
			Success: string;
			username: string;
			isAnonymous: string;
			visitsCount: string;
			token: string;
		};
		cookies: {};
		nested: {}[];
	}> {
		return super.makeRequest(cookies, undefined, headers) as Promise<{
			data: {
				Success: string;
				username: string;
				isAnonymous: string;
				visitsCount: string;
				token: string;
			};
			cookies: {};
			nested: {}[];
		}>;
	}

	protected buildRequest(
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		},
		headers: { token: string }
	): AxiosRequestConfig<any> {
		const request = {
			method: 'get',
			maxBodyLength: Infinity,
			url: 'https://central.qnomy.com/CentralAPI/UserGetInfo',
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
		return request;
	}

	protected parseResponseData(data: any): { [key: string]: string } {
		if (!this.isApiResponse(data)) {
			throw new BadApiResponse({
				message: 'response does not conform in format',
				source: 'UserGetInfo',
			});
		}

		return this.transformResponse(data);
	}

	private isApiResponse(data: any) {
		return (
			data?.Success !== undefined &&
			data?.Results?.username !== undefined &&
			data?.Results?.emaiAddress !== undefined &&
			data?.Results?.isAnonymous !== undefined &&
			data?.Results?.isExternalLogin !== undefined &&
			data?.Results?.hasSingleActiveVisitToday !== undefined &&
			data?.Results?.hasMultipleVisits !== undefined &&
			data?.Results?.hasActiveVisits !== undefined &&
			data?.Results?.visitId !== undefined &&
			data?.Results?.smsNotificationsEnabled !== undefined &&
			data?.Results?.smsVerified !== undefined &&
			data?.Results?.phoneMask !== undefined &&
			data?.Results?.smsVerified !== undefined &&
			data?.Results?.token !== undefined &&
			data?.Page !== undefined &&
			data?.ResultsPerPage !== undefined &&
			data?.TotalResults !== undefined &&
			data?.ErrorMessage !== undefined &&
			data?.ErrorNumber !== undefined &&
			data?.Messages !== undefined
		);
	}
}
