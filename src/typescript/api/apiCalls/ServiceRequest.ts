import { IExpectedServerResponse, PostBaseRequest } from './BaseRequest';

export class PostServiceRequest extends PostBaseRequest {
	private parseServiceResponse(responseData: IExpectedServiceResponse): IPostServicesResponse[] {
		const failReasons: string[] = [];
		const { Results } = responseData;

		if (Array.isArray(Results) && Results.length > 0) {
			const serviceId = Results[0].serviceId;
			const ServiceTypeId = Results[0].ServiceTypeId;
			if (typeof serviceId !== 'number') {
				failReasons.push('serviceId is not a number');
			}
			if (typeof ServiceTypeId !== 'number') {
				failReasons.push('ServiceTypeId is not a number');
			}
		}

		if (failReasons.length > 0) {
			throw new Error(`[Parse Service Response][Failures ${failReasons.join(';')}]`);
		}

		return Results;
	}

	async makeServiceRequest(required: IPostServiceRequired) {
		const { headers, url } = required;

		const axiosRequestConfig = this.getAxiosRequestConfig();
		axiosRequestConfig.url = 'CentralAPI/LocationGetServices';
		axiosRequestConfig.headers.authorization = 'JWT ' + headers.authorization;
		axiosRequestConfig.headers.Cookie = this.reformatCookiesForAxios(headers.cookies);
		axiosRequestConfig.params = {
			locationId: url.locationId,
			serviceTypeId: url.serviceTypeId,
		};

		const { status, statusText, responseData } =
			await this.israelPostRequest<IExpectedServiceResponse>(axiosRequestConfig);

		if (status < 200 || status > 299) {
			throw new Error(`[Make Service Request][Status: ${status}][Status Text ${statusText}]`);
		}

		return this.parseServiceResponse(responseData);
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// ##############################################
// ### Israel Post Data Response ################
// ##############################################

export interface IExpectedServiceResponse extends IExpectedServerResponse {
	Results: {
		serviceId: number;
		serviceName: string;
		serviceDescription: string;
		ServiceTypeId: number;
		serviceTypeDescription: string;
		description: string;
		showStats: boolean;
		waitingTime: number;
		HasCalendarService: boolean;
		DynamicFormsEnabled: boolean;
		HasFIFOService: boolean;
		ExtRef: string;
		LocationId: number;
	}[];
}

// ##############################################
// ### 'Make Server Request' Response ###########
// ##############################################

export interface IPostServicesResponse {
	serviceId: number;
	serviceName: string;
	serviceDescription: string;
	ServiceTypeId: number;
	serviceTypeDescription: string;
	description: string;
	showStats: boolean;
	waitingTime: number;
	HasCalendarService: boolean;
	DynamicFormsEnabled: boolean;
	HasFIFOService: boolean;
	ExtRef: string;
	LocationId: number;
}

// ##############################################
// ### Required Data For Request ################
// ##############################################

export interface IPostServiceRequired {
	url: { locationId: string; serviceTypeId: string };
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
