// import {
// 	BranchRequest,
// 	IAxiosResponseReport,
// 	IConfigBuildData,
// 	IExpectedServerResponse,
// 	IResponseGenerator,
// } from './BranchRequest';

// export interface IExpectedServiceResponse extends IExpectedServerResponse {
// 	Results: {
// 		serviceId: number;
// 		serviceName: string;
// 		serviceDescription: string;
// 		ServiceTypeId: number;
// 		serviceTypeDescription: string;
// 		description: string;
// 		showStats: boolean;
// 		waitingTime: number;
// 		HasCalendarService: boolean;
// 		DynamicFormsEnabled: boolean;
// 		HasFIFOService: boolean;
// 		ExtRef: string;
// 		LocationId: number;
// 	}[];
// }

// export interface IServicesConfigBuild extends IConfigBuildData {
// 	url: { locationId: string; serviceTypeId: string };
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

// export interface IServicesResponseReport extends IAxiosResponseReport {
// 	data: {};
// 	results: {
// 		serviceId: number;
// 		serviceName: string;
// 		serviceDescription: string;
// 		ServiceTypeId: number;
// 		serviceTypeDescription: string;
// 		description: string;
// 		showStats: boolean;
// 		waitingTime: number;
// 		HasCalendarService: boolean;
// 		DynamicFormsEnabled: boolean;
// 		HasFIFOService: boolean;
// 		ExtRef: string;
// 		LocationId: number;
// 	}[];
// }

// export class ServicesRequest extends BranchRequest<
// 	IExpectedServiceResponse,
// 	IServicesResponseReport,
// 	IServicesConfigBuild
// > {
// 	buildRequestConfig(data: IServicesConfigBuild): boolean {
// 		try {
// 			this.commonConfig.url =
// 				'https://central.qnomy.com/CentralAPI/LocationGetServices?locationId=' +
// 				data.url.locationId +
// 				'&serviceTypeId=' +
// 				data.url.serviceTypeId;
// 			this.commonConfig.headers.authorization = 'JWT ' + data.headers.authorization;
// 			this.commonConfig.headers.Cookie = this.reformatCookiesForAxios(data.headers.cookies);
// 			return true;
// 		} catch (error) {
// 			this.error = error as Error;
// 			return false;
// 		}
// 	}

// 	parseAPIResponse(): IServicesResponseReport | null {
// 		try {
// 			const errorMessage = this.axiosResponse?.data?.ErrorMessage ?? '';
// 			const success = this.axiosResponse?.data?.Success ?? false;
// 			let results = this.axiosResponse?.data?.Results;

// 			if (success !== true) {
// 				this.reasons.push('response "success" is false');
// 				return null;
// 			} else if (results === null || results === undefined) {
// 				this.reasons.push('response is success and no services');
// 				results = [];
// 			}
// 			if (errorMessage !== null && errorMessage !== undefined && errorMessage.length > 0) {
// 				this.reasons.push(`response has error: ${errorMessage}`);
// 				return null;
// 			}

// 			if (Array.isArray(results) && results.length > 0) {
// 				const serviceId = this.axiosResponse?.data?.Results[0].serviceId;
// 				const ServiceTypeId = this.axiosResponse?.data?.Results[0].ServiceTypeId;
// 				if (typeof serviceId !== 'number') {
// 					this.reasons.push('serviceId is not a number');
// 					return null;
// 				}
// 				if (typeof ServiceTypeId !== 'number') {
// 					this.reasons.push('ServiceTypeId is not a number');
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
