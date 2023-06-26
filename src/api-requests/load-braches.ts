import { IApiRequest } from '../common/interfaces/IApiRequest';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { BaseApiRequestBuilder } from './base-build-request';

class LoadBranchesBuilder extends BaseApiRequestBuilder {
	readonly cookiesToFInd = [
		'__uzma',
		'__uzmb',
		'__uzme',
		'__RequestVerificationToken',
		'__uzmd',
		'_ga_L9GGZQ01FV',
		'_ga',
		'_gid',
		'_gat_UA-88269527-1',
	];

	constructor(
		cookies: ICookiesObject,
		authorization: any,
		urlAttributes: any,
		data: { __RequestVerificationToken: string }
	) {
		super(cookies, authorization, urlAttributes, data);
	}

	public buildApiRequest(): IApiRequest {
		const reformatCookies = this.reformatForAxios(
			this.cookies || {},
			this.cookiesToFInd
		);

		const returnApiRequest: IApiRequest = {
			config: {
				method: 'post',
				maxBodyLength: Infinity,
				url: 'https://israelpost.co.il/umbraco/Surface/Branches/LoadBranches',
				headers: {
					authority: 'israelpost.co.il',
					accept: '*/*',
					'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
					'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
					cookie: reformatCookies,
					origin: 'https://israelpost.co.il',
					referer:
						'https://israelpost.co.il/%D7%A9%D7%99%D7%A8%D7%95%D7%AA%D7%99%D7%9D/%D7%90%D7%99%D7%AA%D7%95%D7%A8-%D7%A1%D7%A0%D7%99%D7%A4%D7%99%D7%9D-%D7%95%D7%96%D7%99%D7%9E%D7%95%D7%9F-%D7%AA%D7%95%D7%A8-%D7%91%D7%A7%D7%9C%D7%99%D7%A7/',
					'sec-ch-ua':
						'"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': '"Windows"',
					'sec-fetch-dest': 'empty',
					'sec-fetch-mode': 'cors',
					'sec-fetch-site': 'same-origin',
					'user-agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
					'x-requested-with': 'XMLHttpRequest',
				},
				data: '__RequestVerificationToken=' + this.data!.__RequestVerificationToken,
			},
		};

		return returnApiRequest;
	}
}

export { LoadBranchesBuilder };
