import { parseResponseCookies } from '../common/ParseCookies';
import { IExpectedServerResponse, PostBaseRequest } from './PostBaseRequest';

export class PostUserRequest extends PostBaseRequest {
	private parseUserResponse({
		data,
		cookies,
	}: {
		data: IExpectedUserResponse;
		cookies: string[] | undefined;
	}): IPostUserResponse {
		const failReasons: string[] = [];

		const token = data?.Results?.token;
		const pCookies = parseResponseCookies(cookies ?? []);
		const CentralJWTCookie = pCookies['CentralJWTCookie'];
		const ARRAffinity = pCookies['ARRAffinity'];
		const ARRAffinitySameSite = pCookies['ARRAffinitySameSite'];
		const GCLB = pCookies['GCLB'];

		if (typeof token !== 'string') {
			failReasons.push('token not a string');
		} else if (!token.length) {
			failReasons.push('token is empty string');
		}
		if (!CentralJWTCookie || !ARRAffinity || !ARRAffinitySameSite || !GCLB) {
			failReasons.push('missing one or more cookie');
		}

		if (failReasons.length > 0) {
			throw new Error(`[Parse User Response][Failures ${failReasons.join(';')}]`);
		}

		return {
			ARRAffinity: ARRAffinity,
			ARRAffinitySameSite: ARRAffinitySameSite,
			CentralJWTCookie: CentralJWTCookie,
			GCLB: GCLB,
			token: token,
		};
	}

	async makeUserRequest() {
		const axiosRequestConfig = this.getAxiosRequestConfig();
		axiosRequestConfig.url = 'CentralAPI/UserCreateAnonymous';
		axiosRequestConfig.headers.authorization = 'JWT null';

		const { status, statusText, responseData, cookies } =
			await this.israelPostRequest<IExpectedUserResponse>(axiosRequestConfig);

		if (status < 200 || status > 299) {
			throw new Error(`[Make User Request][Status: ${status}][Status Text ${statusText}]`);
		}

		return this.parseUserResponse({ data: responseData, cookies });
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// ##############################################
// ### Israel Post Data Response ################
// ##############################################

export interface IExpectedUserResponse extends IExpectedServerResponse {
	Results: {
		token: string;
		username: string;
	};
}

// ##############################################
// ### 'Make User Request' Response #############
// ##############################################

export interface IPostUserResponse {
	token: string;
	CentralJWTCookie: string;
	ARRAffinity: string;
	ARRAffinitySameSite: string;
	GCLB: string;
}
