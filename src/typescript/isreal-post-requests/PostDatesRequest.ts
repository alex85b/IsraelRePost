import { getTodayDateObject } from '../common/todays-date';
import { IExpectedServerResponse, PostBaseRequest } from './PostBaseRequest';

export class PostDatesRequest extends PostBaseRequest {
	private parseDatesResponse(responseData: IExpectedDatesResponse): IPostDatesResponse[] {
		const failReasons: string[] = [];
		const { Results } = responseData;

		if (Array.isArray(Results) && Results.length > 0) {
			const calendarDate = Results[0].calendarDate;
			const calendarId = Results[0].calendarId;
			if (typeof calendarDate !== 'string') {
				failReasons.push('calendarDate is not a string');
			} else if (calendarDate.length === 0) {
				failReasons.push('calendarDate is empty');
			}
			if (typeof calendarId !== 'number') {
				failReasons.push('calendarId is not a number');
			}
		}

		if (failReasons.length > 0) {
			throw new Error(`[Parse Service Response][Failures ${failReasons.join(';')}]`);
		}

		return Results;
	}

	async makeDatesRequest(required: IPostDatesRequired) {
		const { headers, url } = required;
		const { date } = getTodayDateObject();
		const axiosRequestConfig = this.getAxiosRequestConfig();
		axiosRequestConfig.url =
			'https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=30&serviceId=' +
			url.serviceId +
			'&startDate=' +
			date;
		axiosRequestConfig.headers.authorization = 'JWT ' + headers.authorization;
		axiosRequestConfig.headers.Cookie = this.reformatCookiesForAxios(headers.cookies);

		const { status, statusText, responseData, cookies } =
			await this.israelPostRequest<IExpectedDatesResponse>(axiosRequestConfig);

		if (status < 200 || status > 299) {
			throw new Error(`[Make Service Request][Status: ${status}][Status Text ${statusText}]`);
		}

		return this.parseDatesResponse(responseData);
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// ##############################################
// ### Israel Post Data Response ################
// ##############################################

export interface IExpectedDatesResponse extends IExpectedServerResponse {
	Results: {
		calendarDate: string;
		calendarId: number;
	}[];
}

// ##############################################
// ### 'Make Server Request' Response ###########
// ##############################################

export interface IPostDatesResponse {
	calendarDate: string;
	calendarId: number;
}

// ##############################################
// ### Required Data For Request ################
// ##############################################

export interface IPostDatesRequired {
	url: { serviceId: string };
	headers: {
		authorization: string;
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		};
	};
}
