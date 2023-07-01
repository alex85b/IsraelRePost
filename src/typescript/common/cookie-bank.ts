import { Protocol } from 'puppeteer';
import { CookieAbsentError } from '../errors/cookie-absent-error';
import { ICookiesObject } from '../interfaces/ICookiesObject';

export class CookieBank {
	private cookies: ICookiesObject = {};

	addCookies(cookies: ICookiesObject) {
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

	importAxiosCookies(axiosCookies: string[]): ICookiesObject {
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
		if (!this.cookies[cookieName])
			throw new CookieAbsentError({
				message: `Cookie ${cookieName} is missing`,
				source: 'getCookieValue',
			});
		return this.cookies[cookieName];
	}

	findCookies(keys: string[]): ICookiesObject {
		const returnCookies: ICookiesObject = {};
		for (const key of keys) {
			if (!this.cookies[key])
				throw new CookieAbsentError({
					message: `Cookie ${keys} is missing`,
					source: 'getCookieValue',
				});
			returnCookies[key] = this.cookies[key];
		}
		return returnCookies;
	}

	toString(): string {
		return JSON.stringify(this.cookies);
	}

	// shallow copy.
	getCookies(): ICookiesObject {
		return Object.assign({}, this.cookies);
	}
}
