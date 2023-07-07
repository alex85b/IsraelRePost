import { AxiosRequestConfig } from 'axios';
import {
	BaseBuildRequestConfig,
	IRequestConfigData,
} from '../BaseBuildRequestConfig';
import { getTodayDateObject } from '../../common/todays-date';

export interface ISearchDatesInput extends IRequestConfigData {
	data: { token: string };
	headers: {
		Cookie: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		};
	};
	url: { serviceId: string; serviceTypeId: string };
}

export class SearchDatesConfig extends BaseBuildRequestConfig {
	protected baseConfig: AxiosRequestConfig<any>;

	constructor({
		data,
		headers,
		proxyAuth,
		proxyUrl,
		url,
		useProxy,
	}: ISearchDatesInput) {
		const configData = {
			data: { token: data.token },
			headers: {
				Cookie: {
					ARRAffinity: headers.Cookie.ARRAffinity,
					ARRAffinitySameSite: headers.Cookie.ARRAffinitySameSite,
					CentralJWTCookie: headers.Cookie.CentralJWTCookie,
					GCLB: headers.Cookie.GCLB,
				},
			},
			url: { serviceId: url.serviceId },
			proxyAuth: proxyAuth,
			proxyUrl: proxyUrl,
			useProxy: useProxy,
		};

		super(configData);

		const { date } = getTodayDateObject();

		this.baseConfig = {
			method: 'get',
			maxBodyLength: Infinity,
			url:
				'https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=30&serviceId=' +
				url.serviceId +
				'&startDate=' +
				date,
			headers: {
				authority: 'central.qnomy.com',
				accept: 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'he-IL,he;q=0.9',
				'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
				'application-name': 'PostIL',
				authorization: 'JWT ' + data.token,
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
				Cookie: this.reformatCookiesForAxios(headers.Cookie),
			},
		};
	}
}
