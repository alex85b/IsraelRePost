import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { IApiRequest } from '../common/interfaces/IApiRequest';
import { BaseApiRequestBuilder, IRequestDate } from './base-build-request';

class SearchAvailableDates extends BaseApiRequestBuilder {
	readonly cookiesToFInd = ['ARRAffinity', 'ARRAffinitySameSite', 'GCLB'];

	constructor(
		cookies: ICookiesObject,
		authorization: string,
		urlAttributes: { serviceId: string; startDate: IRequestDate }
	) {
		super(cookies, authorization, urlAttributes);
	}

	public buildApiRequest(): IApiRequest {
		const reformatCookies = this.reformatForAxios(
			this.cookies,
			this.cookiesToFInd
		);

		const returnApiRequest: IApiRequest = {
			config: {
				method: 'get',
				maxBodyLength: Infinity,
				url:
					'https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=30&serviceId=' +
					this.urlAttributes?.serviceId +
					'&startDate=' +
					this.urlAttributes?.startDate?.yyyy +
					'-' +
					this.urlAttributes?.startDate?.mm +
					'-' +
					this.urlAttributes?.startDate?.dd,
				headers: {
					authority: 'central.qnomy.com',
					accept: 'application/json, text/javascript, */*; q=0.01',
					'accept-language': 'he-IL,he;q=0.9',
					'application-api-key': 'CA4ED65C-DC64-4969-B47D-EF564E3763E7',
					'application-name': 'PostIL',
					authorization: 'JWT ' + this.authorization,
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
					Cookie: reformatCookies,
				},
			},
		};

		return returnApiRequest;
	}
}

export { SearchAvailableDates };
