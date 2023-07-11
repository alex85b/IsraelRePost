import { AxiosRequestConfig } from 'axios';
import {
	BaseBuildRequestConfig,
	IRequestConfigData,
} from '../BaseBuildRequestConfig';

export interface ISearchTimesInput extends IRequestConfigData {
	data: { token: string };
	headers: {
		Cookie: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			GCLB: string;
		};
	};
	url: { CalendarId: string; ServiceId: string; dayPart: string };
}

export class SearchTimesConfig extends BaseBuildRequestConfig {
	protected baseConfig: AxiosRequestConfig<any>;

	constructor({
		data,
		headers,
		proxyAuth,
		proxyUrl,
		url,
		useProxy,
	}: ISearchTimesInput) {
		const configData = {
			data: { token: data.token },
			headers: {
				Cookie: {
					ARRAffinity: headers.Cookie.ARRAffinity,
					ARRAffinitySameSite: headers.Cookie.ARRAffinitySameSite,
					GCLB: headers.Cookie.GCLB,
				},
			},
			url: {
				CalendarId: url.CalendarId,
				ServiceId: url.ServiceId,
				dayPart: url.dayPart,
			},
			proxyAuth: proxyAuth,
			proxyUrl: proxyUrl,
			useProxy: useProxy,
		};

		super(configData);

		this.baseConfig = {
			method: 'get',
			maxBodyLength: Infinity,
			url:
				'https://central.qnomy.com/CentralAPI/SearchAvailableSlots?CalendarId=' +
				url.CalendarId +
				'&ServiceId=' +
				url.ServiceId +
				'&dayPart=' +
				url.dayPart,
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
