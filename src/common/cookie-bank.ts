import { Protocol } from 'puppeteer';
import { CookieAbsentError } from '../errors/cookie-absent-error';
import { CookiesObject } from './cookies-object-interface';

export class CookieBank {
	private cookies: CookiesObject = {};

	static reformatForAxios(cookies: CookiesObject) {
		const responseArray: string[] = [];
		for (const key in cookies) {
			responseArray.push(`${key}=${cookies[key]}`);
		}
		return responseArray;
	}

	addCookies(cookies: CookiesObject) {
		for (const key in cookies) {
			this.cookies[key] = cookies[key];
		}
	}

	importPuppeteerCookies(pptrCookies: Protocol.Network.Cookie[]) {
		pptrCookies.forEach((cookie) => {
			this.cookies[cookie.name] = cookie.value;
		});
		return this.getCookies();
	}

	importAxiosCookies(axiosCookies: string[]): CookiesObject {
		axiosCookies.forEach((cell) => {
			if (cell.includes('=')) {
				const delimiter = ';';
				const delimiterIndex = cell.indexOf(delimiter);
				let tempCookieArr: string[];
				if (cell.includes('CentralJWTCookie=jwt=')) {
					tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=jwt=');
					this.cookies[tempCookieArr[0]] = 'jwt=' + tempCookieArr[1];
				} else {
					tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=');
					this.cookies[tempCookieArr[0]] = tempCookieArr[1];
				}
			}
		});
		return this.getCookies();
	}

	getCookieValue(cookieName: string): string {
		if (!this.cookies[cookieName]) throw new CookieAbsentError();
		return this.cookies[cookieName];
	}

	toString(): string {
		return JSON.stringify(this.cookies);
	}

	// shallow copy.
	getCookies(): CookiesObject {
		return Object.assign({}, this.cookies);
	}
}
