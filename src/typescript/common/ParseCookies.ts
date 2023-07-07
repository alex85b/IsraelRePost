export const parseResponseCookies = (
	cookies: string[]
): { [key: string]: string } => {
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
