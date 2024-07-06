import { AxiosResponse } from 'axios';
import { Cookies } from './shared/PostofficeCookies';
import { constructCookieDictionary } from './shared/ReformatCookies';
import { IPostofficeResponseData } from './shared/PostofficeResponseData';

export interface IExpectedUserResponse extends IPostofficeResponseData {
	Results: {
		token: string;
		username: string;
	};
}

export interface IRequestUserResponse {
	getCookies(): Cookies;
	getToken(): string;
}

export class RequestUserResponse implements IRequestUserResponse {
	private cookies: Cookies;
	private token: string;

	private constructor(buildData: { cookies: Cookies; token: string }) {
		this.cookies = buildData.cookies;
		this.token = buildData.token;
	}

	getCookies() {
		return { ...this.cookies };
	}

	getToken() {
		return this.token;
	}

	static Builder = class {
		private cookies: Cookies;
		private token: string;

		constructor() {
			this.cookies = {
				ARRAffinity: '',
				ARRAffinitySameSite: '',
				CentralJWTCookie: '',
				GCLB: '',
			};
			this.token = '';
		}

		useAxiosResponse(
			rawResponse: Omit<AxiosResponse<IExpectedUserResponse, any>, 'request' | 'config'>
		) {
			const success = rawResponse.data?.Success ?? false;
			const cookiesString = rawResponse?.headers['set-cookie'];
			const token = rawResponse.data?.Results?.token;
			const faults: string[] = [];

			if (typeof success !== 'boolean' || (typeof success === 'boolean' && !success)) {
				faults.push('user response status is failed');
			}
			if (!Array.isArray(cookiesString) || !cookiesString.length) {
				faults.push('user response contains no cookies string');
			}
			if (typeof token !== 'string' || !token.length) {
				faults.push('user response data has no token');
			}
			if (faults.length) throw Error(faults.join(' | '));

			this.token = token;

			const partialCookies = constructCookieDictionary(cookiesString!);
			if (Object.keys(partialCookies).length != 4) {
				throw Error('user response missing some cookies');
			}
			this.cookies = partialCookies as Cookies;
			return this;
		}

		build() {
			return new RequestUserResponse({ cookies: this.cookies, token: this.token });
		}
	};
}
