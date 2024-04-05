export type Cookie = 'ARRAffinity' | 'ARRAffinitySameSite' | 'CentralJWTCookie' | 'GCLB';

export type ICookies = Partial<{
	[key in Cookie]: string;
}>;

export const flattenDictionaryOfCookies = (cookies: ICookies) => {
	const responseArray: string[] = [];
	for (const cookie in cookies) {
		if (cookies[cookie as Cookie]) {
			responseArray.push(`${cookie}=${cookies[cookie as Cookie]}`);
		}
	}
	return responseArray.join(' ');
};

export const constructCookieDictionary = (cookies: string[]): { [key: string]: string } => {
	const transformed: { [key: string]: string } = {};
	cookies.forEach((cell) => {
		if (cell.includes('=')) {
			const delimiter = ';'; // Throw away all the information after ';'
			const delimiterIndex = cell.indexOf(delimiter);
			let tempCookieArr: string[];
			if (cell.includes('CentralJWTCookie=jwt=')) {
				// Split on the first '=' sign.
				tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=jwt=');
				transformed[tempCookieArr[0]] = 'jwt=' + tempCookieArr[1];
			} else {
				tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=');
				transformed[tempCookieArr[0]] = tempCookieArr[1];
			}
		} // Ignores a cell without '=' sign.
	});
	return transformed;
};

export const TYY = (cookies: string[]): ICookies => {
	const transformed: ICookies = {};
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
