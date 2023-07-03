import axios, { AxiosRequestConfig } from 'axios';
import { NotProvided } from '../errors/NotProvided';
import {} from 'worker_threads';

export abstract class BaseApiRequest {
	protected producedData: { [key: string]: string } = {};
	protected producedCookies: { [key: string]: string } = {};
	protected requestCookieHeaders: string[] = [];
	protected requestUrlAttributes: string[] = [];
	protected requestHeadersKeys: string[] = [];
	protected requestDataKeys: string[] = [];
	protected responseCookieHeaders: string[] = [];
	protected responseDataKeys: string[] = [];
	protected nestedResponse: { [key: string]: any }[] = [];
	protected nameOfThis = 'BaseApiRequest';

	// constructor() {}

	protected abstract buildRequest(
		cookies: { [key: string]: string },
		urlAttribute: { [key: string]: string },
		headers: { [key: string]: string },
		data: { [key: string]: string }
	): AxiosRequestConfig<any>;

	async makeRequest(
		cookies: { [key: string]: string } = {},
		urlAttribute: { [key: string]: string } = {},
		headers: { [key: string]: string } = {},
		data: { [key: string]: string } = {}
	) {
		this.checkProvidedData('Cookie', cookies, this.requestCookieHeaders, true);
		this.checkProvidedData('Url', urlAttribute, this.requestUrlAttributes, true);
		this.checkProvidedData('Headers', headers, this.requestHeadersKeys, true);
		this.checkProvidedData('Data', data, this.requestDataKeys, true);

		const server_response = await axios.request(
			this.buildRequest(cookies, urlAttribute, headers, data)
		);

		let response_cookies: string[] = [];
		if (server_response.headers) {
			response_cookies = server_response.headers['set-cookie'] || [];
		}
		const response_data = server_response.data;
		const parsed_data = this.parseResponseData(response_data);
		const parsed_cookies = this.parseResponseCookies(response_cookies);

		this.checkProvidedData(
			'RHeaders',
			parsed_cookies,
			this.responseCookieHeaders,
			false
		);

		this.checkProvidedData('RData', parsed_data, this.responseDataKeys, false);

		this.producedData = parsed_data;
		this.producedCookies = parsed_cookies;
		return {
			data: this.producedData,
			cookies: this.producedCookies,
			nested: this.nestedResponse,
		};
	}

	protected checkProvidedData(
		reason: string,
		provided: { [key: string]: string } = {},
		expected: string[],
		beforeRequest: boolean
	) {
		// console.log(' [BaseApiRequest] [checkProvidedData] reason: ', reason);
		for (const expectedKey of expected) {
			if (!provided.hasOwnProperty(expectedKey)) {
				// console.log('??? provided ??? : ', provided);
				// console.log('??? expectedKey ??? : ', expectedKey);
				throw new NotProvided({
					message: `${
						beforeRequest ? 'provided' : 'produced'
					} data does not contain expected: ${expectedKey} `,
					source: `[${this.nameOfThis}] checkProvidedData`,
				});
			}
		}
	}

	protected abstract parseResponseData(data: any): { [key: string]: string };

	protected parseResponseCookies(cookies: string[]): { [key: string]: string } {
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
	}

	protected reformatForAxios(cookies: { [key: string]: string }) {
		const responseArray: string[] = [];
		for (const cookie in cookies) {
			responseArray.push(`${String(cookie)}=${cookies[cookie]}`);
		}
		return responseArray.join(' ');
	}

	//! Only two levels of depth !
	// This done to fit the predefined class data members.
	protected transformResponse(data: any) {
		const transformed: { [key: string]: string } = {};

		for (const key in data) {
			const value = data[key];
			// Transform anything not nested directly to string.
			if (typeof value !== 'object' || value === null) {
				transformed[key] = String(value);
			} else {
				// Iterate over nested keys (one level of depth).
				for (const nestedKey in value) {
					// If null there will be nothing to iterate.
					const nestedValue = value[nestedKey];
					if (typeof nestedValue !== 'object' && nestedValue !== null) {
						transformed[nestedKey] = String(nestedValue);
					}
				}
			}
		}

		return transformed;
	}

	protected getRequiredAndProvided() {
		return {
			requestCookieHeaders: this.requestCookieHeaders,
			requestDataKeys: this.requestDataKeys,
			requestHeadersKeys: this.requestHeadersKeys,
			requestUrlAttributes: this.requestUrlAttributes,
			responseCookieHeaders: this.responseCookieHeaders,
			responseDataKeys: this.responseDataKeys,
		};
	}

	getTodayDateObject() {
		const today = new Date();
		const year = today.getFullYear();
		// 'getMonth' returns a zero-based value: January == 0.
		// padStart ensures that i have 2 'digits', it pads with 0 in case i have 1 digit.
		const month = String(today.getMonth() + 1).padStart(2, '0');
		// same procedure as month.
		const day = String(today.getDate()).padStart(2, '0');
		const dateString = `${year}-${month}-${day}`;
		return {
			date: dateString,
			year: String(year),
			month: String(month),
			day: String(day),
		};
	}

	validateDateFormat(dateString: string) {
		// Regular expression pattern for yyyy-mm-dd format
		const pattern = /^\d{4}-\d{2}-\d{2}$/;

		// Check if the string matches the pattern
		return pattern.test(dateString);
	}
}
