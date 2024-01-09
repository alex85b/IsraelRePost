// import { IExpectedServerResponse } from '../isreal-post-requests/PostBaseRequest';
// import { BranchRequest, IAxiosResponseReport, IConfigBuildData } from './BranchRequest';

// export interface ITimesConfigBuild extends IConfigBuildData {
// 	url: { CalendarId: string; ServiceId: string; dayPart: string };
// 	headers: {
// 		authorization: string;
// 		cookies: {
// 			ARRAffinity: string;
// 			ARRAffinitySameSite: string;
// 			GCLB: string;
// 		};
// 	};
// }

// export interface ITimesResponseReport extends IAxiosResponseReport {
// 	data: {};
// 	results: {
// 		Time: number;
// 	}[];
// }

// export class TimesRequest extends BranchRequest<
// 	IExpectedTimesResponse,
// 	ITimesResponseReport,
// 	ITimesConfigBuild
// > {
// 	// implements IResponseGenerator<ITimesResponseReport>
// 	buildRequestConfig(data: ITimesConfigBuild): boolean {
// 		try {
// 			this.commonConfig.url =
// 				'https://central.qnomy.com/CentralAPI/SearchAvailableSlots?CalendarId=' +
// 				data.url.CalendarId +
// 				'&ServiceId=' +
// 				data.url.ServiceId +
// 				'&dayPart=' +
// 				data.url.dayPart;
// 			this.commonConfig.headers.authorization = 'JWT ' + data.headers.authorization;
// 			this.commonConfig.headers.Cookie = this.reformatCookiesForAxios(data.headers.cookies);
// 			return true;
// 		} catch (error) {
// 			this.error = error as Error;
// 			return false;
// 		}
// 	}
// 	parseAPIResponse(): ITimesResponseReport | null {
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
// 				const time = this.axiosResponse?.data?.Results[0].Time;
// 				if (typeof time !== 'number') {
// 					this.reasons.push('time is not a number');
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

// // ###################################################################################################
// // ### Interfaces ####################################################################################
// // ###################################################################################################

// // ##############################################
// // ### Israel Post Data Response ################
// // ##############################################

// export interface IExpectedTimesResponse extends IExpectedServerResponse {
// 	Results: {
// 		Time: number;
// 	}[];
// }

// // ##############################################
// // ### 'Make Server Request' Response ###########
// // ##############################################

// // ##############################################
// // ### Required Data For Request ################
// // ##############################################
