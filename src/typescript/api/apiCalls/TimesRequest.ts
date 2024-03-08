import { IExpectedServerResponse, PostBaseRequest } from './BaseRequest';

export class PostTimesRequest extends PostBaseRequest {
	private parseDatesResponse(responseData: IExpectedTimesResponse): IPostTimesResponse[] {
		const failReasons: string[] = [];
		const { Results } = responseData;

		if (Array.isArray(Results) && Results.length > 0) {
			const time = Results[0].Time;
			if (typeof time !== 'number') {
				failReasons.push('time is not a number');
			}
		}

		if (failReasons.length > 0) {
			throw new Error(`[Parse Dates Response][Failures ${failReasons.join(';')}]`);
		}

		return Results;
	}

	async makeTimesRequest(required: IPostTimesRequired) {
		const { headers, url } = required;

		const axiosRequestConfig = this.getAxiosRequestConfig();
		axiosRequestConfig.url = 'CentralAPI/SearchAvailableSlots';
		axiosRequestConfig.headers.authorization = 'JWT ' + headers.authorization;
		axiosRequestConfig.headers.Cookie = this.reformatCookiesForAxios(headers.cookies);
		axiosRequestConfig.params = {
			CalendarId: url.CalendarId,
			ServiceId: url.ServiceId,
			dayPart: url.dayPart,
		};

		const { status, statusText, responseData, cookies } =
			await this.israelPostRequest<IExpectedTimesResponse>(axiosRequestConfig);

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

export interface IExpectedTimesResponse extends IExpectedServerResponse {
	Results: {
		Time: number;
	}[];
}

// ##############################################
// ### 'Make Server Request' Response ###########
// ##############################################

export interface IPostTimesResponse {
	Time: number;
}

// ##############################################
// ### Required Data For Request ################
// ##############################################

export interface IPostTimesRequired {
	url: { CalendarId: string; ServiceId: string; dayPart: string };
	headers: {
		authorization: string;
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			GCLB: string;
		};
	};
}
