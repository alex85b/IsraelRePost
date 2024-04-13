import { Cookie, PartialCookies } from './PostofficeCookies';

export const constructCookieDictionary = (cookies: string[]): PartialCookies => {
	const transformed: PartialCookies = {};
	cookies.forEach((cell) => {
		if (cell.includes('=')) {
			/* 
			Delimiter Will be used to discard 'cell' data that appears after 'delimiter'*/
			const delimiter = ';';
			const delimiterIndex = cell.indexOf(delimiter);
			let tempCookieArr: string[];
			if (cell.includes('CentralJWTCookie=jwt=')) {
				// Split on the whole '=jwt=' word.
				tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=jwt=');
				transformed[tempCookieArr[0] as Cookie] = 'jwt=' + tempCookieArr[1];
			} else {
				tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=');
				transformed[tempCookieArr[0] as Cookie] = tempCookieArr[1];
			}
		}
		// Ignores a cell without '=' sign.
	});
	return transformed;
};

export const flattenDictionaryOfCookies = (cookies: PartialCookies) => {
	const responseArray: string[] = [];
	for (const cookie in cookies) {
		if (cookies[cookie as Cookie]) {
			responseArray.push(`${cookie}=${cookies[cookie as Cookie]}`);
		}
	}
	return responseArray.join(' ');
};
