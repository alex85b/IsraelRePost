import { parseResponseCookies } from "../common/ParseCookies";
import {
	BranchRequest,
	IAxiosResponseReport,
	IConfigBuildData,
	IExpectedServerResponse,
} from "./BranchRequest";

export interface IExpectedUserResponse extends IExpectedServerResponse {
	Results: {
		token: string;
		username: string;
	};
}

export interface IUserResponseReport extends IAxiosResponseReport {
	data: {
		token: string;
		CentralJWTCookie: string;
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		GCLB: string;
	};
	results: [];
}

export interface IUserConfigBuild extends IConfigBuildData {
	url: {};
	headers: {};
}

export class UserRequest extends BranchRequest<
	IExpectedUserResponse,
	IUserResponseReport,
	IUserConfigBuild
> {
	// implements IResponseGenerator<IUserResponseReport>
	parseAPIResponse(): IUserResponseReport | null {
		try {
			const token = this.axiosResponse?.data.Results.token;
			const rawCookies = this.axiosResponse?.headers["set-cookie"] ?? [];
			const cookies = parseResponseCookies(rawCookies);
			const CentralJWTCookie = cookies["CentralJWTCookie"];
			const ARRAffinity = cookies["ARRAffinity"];
			const ARRAffinitySameSite = cookies["ARRAffinitySameSite"];
			const GCLB = cookies["GCLB"];

			if (typeof token !== "string") {
				this.reasons.push("token not a string");
				return null;
			} else if (!token.length) {
				this.reasons.push("token is empty string");
				return null;
			}
			if (!CentralJWTCookie || !ARRAffinity || !ARRAffinitySameSite || !GCLB) {
				this.reasons.push("missing one or more cookie");
				return null;
			}

			return {
				data: {
					ARRAffinity: ARRAffinity,
					ARRAffinitySameSite: ARRAffinitySameSite,
					CentralJWTCookie: CentralJWTCookie,
					GCLB: GCLB,
					token: token,
				},
				results: [],
			};
		} catch (error) {
			this.error = error as Error;
			return null;
		}
	}

	buildRequestConfig(): boolean {
		try {
			this.commonConfig.url = "https://central.qnomy.com/CentralAPI/UserCreateAnonymous";
			this.commonConfig.headers.authorization = "JWT null";
			return true;
		} catch (error) {
			this.error = error as Error;
			return false;
		}
	}
}
