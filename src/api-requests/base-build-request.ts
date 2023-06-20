import { IApiRequest } from './api-request-interface';
import { CookiesObject } from '../common/cookies-object-interface';
import { CookieAbsentError } from '../errors/cookie-absent-error';

export abstract class BaseApiRequestBuilder {
	abstract readonly cookiesToFInd: string[];
	protected cookies: CookiesObject;
	protected token: string;
	protected data: string;

	constructor(cookies: CookiesObject, token: string, data: string) {
		this.cookies = cookies;
		this.token = token;
		this.data = data;
	}

	abstract buildApiRequest(): IApiRequest;

	reformatForAxios<T extends CookiesObject, K extends keyof T>(
		cookies: T,
		keysToSearch: K[]
	) {
		const responseArray: string[] = [];
		for (const key of keysToSearch) {
			if (!(key in cookies)) {
				throw new CookieAbsentError();
			}
			responseArray.push(`${String(key)}=${cookies[key]}`);
		}
		return responseArray;
	}
}
