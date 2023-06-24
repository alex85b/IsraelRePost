import { IApiRequest } from '../common/interfaces/IApiRequest';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { BadRequestError } from '../errors/bad-request-error';
import { CookieAbsentError } from '../errors/cookie-absent-error';

export interface IRequestData {
	branchnumber?: string;
	__RequestVerificationToken?: string;
}

export interface IRequestDate {
	yyyy: string;
	mm: string;
	dd: string;
}

export interface IRequestUrlAttributes {
	maxResults?: string;
	serviceId?: string;
	startDate?: IRequestDate;
	locationId?: string; //* <== qnomy.
	serviceTypeId?: string;
	dayPart?: string;
}

export abstract class BaseApiRequestBuilder {
	abstract readonly cookiesToFInd: string[];

	constructor(
		protected cookies?: ICookiesObject,
		protected authorization?: string,
		protected urlAttributes?: IRequestUrlAttributes,
		protected data?: IRequestData
	) {
		if (urlAttributes?.startDate) {
			const dateError = new BadRequestError({
				message: 'the date provided should be of the format: yyyy, dd, mm',
				source: 'BaseApiRequestBuilder',
			});
			const yearPattern = /^\d{4}$/;
			const dayMonthPattern = /^\d{2}$/;
			if (!yearPattern.test(urlAttributes?.startDate.yyyy)) throw dateError;
			if (!dayMonthPattern.test(urlAttributes?.startDate.mm)) throw dateError;
			if (!dayMonthPattern.test(urlAttributes?.startDate.dd)) throw dateError;
		}
	}

	abstract buildApiRequest(): IApiRequest;

	reformatForAxios<T extends ICookiesObject, K extends keyof T>(
		cookies: T,
		keysToSearch: K[]
	) {
		const responseArray: string[] = [];
		for (const key of keysToSearch) {
			if (!(key in cookies)) {
				throw new CookieAbsentError({
					message: 'Missing cookie',
					source: String(key),
				});
			}
			responseArray.push(`${String(key)}=${cookies[key]}`);
		}
		return responseArray;
	}
}
