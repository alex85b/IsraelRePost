// import { getTodayDateObject } from '../common/todays-date';
// import {
// 	BranchRequest,
// 	IAxiosResponseReport,
// 	IConfigBuildData,
// 	IExpectedServerResponse,
// } from './BranchRequest';

// export interface IExpectedDatesResponse extends IExpectedServerResponse {
// 	Results: {
// 		calendarDate: string;
// 		calendarId: number;
// 	}[];
// }

// export interface IDatesConfigBuild extends IConfigBuildData {
// 	url: { serviceId: string };
// 	headers: {
// 		authorization: string;
// 		cookies: {
// 			ARRAffinity: string;
// 			ARRAffinitySameSite: string;
// 			CentralJWTCookie: string;
// 			GCLB: string;
// 		};
// 	};
// }

// export interface IDatesResponseReport extends IAxiosResponseReport {
// 	data: {};
// 	results: {
// 		calendarDate: string;
// 		calendarId: number;
// 	}[];
// }

// export class DatesRequest extends BranchRequest<
// 	IExpectedDatesResponse,
// 	IDatesResponseReport,
// 	IDatesConfigBuild
// > {
// 	// implements IResponseGenerator<IDatesResponseReport>
// 	buildRequestConfig(data: IDatesConfigBuild): boolean {
// 		try {
// 			const { date } = getTodayDateObject();
// 			this.commonConfig.url =
// 				'https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=30&serviceId=' +
// 				data.url.serviceId +
// 				'&startDate=' +
// 				date;
// 			this.commonConfig.headers.authorization = 'JWT ' + data.headers.authorization;
// 			this.commonConfig.headers.Cookie = this.reformatCookiesForAxios(data.headers.cookies);
// 			return true;
// 		} catch (error) {
// 			this.error = error as Error;
// 			return false;
// 		}
// 	}
// 	parseAPIResponse(): IDatesResponseReport | null {
// 		try {
// 			const errorMessage = this.axiosResponse?.data?.ErrorMessage ?? '';
// 			const success = this.axiosResponse?.data?.Success ?? false;
// 			let results = this.axiosResponse?.data?.Results;

// 			if (success !== true) {
// 				this.reasons.push('response "success" is false');
// 				return null;
// 			} else if (results === null || results === undefined) {
// 				this.reasons.push('response is success and no dates');
// 				results = [];
// 			}
// 			if (errorMessage !== null && errorMessage !== undefined && errorMessage.length > 0) {
// 				this.reasons.push(`response has error: ${errorMessage}`);
// 				return null;
// 			}

// 			if (Array.isArray(results) && results.length > 0) {
// 				const calendarDate = this.axiosResponse?.data?.Results[0].calendarDate;
// 				const calendarId = this.axiosResponse?.data?.Results[0].calendarId;
// 				if (typeof calendarDate !== 'string') {
// 					this.reasons.push('calendarDate is not a string');
// 					return null;
// 				} else if (calendarDate.length === 0) {
// 					this.reasons.push('calendarDate is empty');
// 					return null;
// 				}
// 				if (typeof calendarId !== 'number') {
// 					this.reasons.push('calendarId is not a number');
// 					return null;
// 				}
// 			}

// 			return { data: {}, results: results };
// 		} catch (error) {
// 			this.error = error as Error;
// 			return null;
// 		}
// 	}
// }
