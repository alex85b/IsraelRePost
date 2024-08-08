import { AxiosResponse } from "axios";
import { Cookies } from "./shared/PostofficeCookies";
import { constructCookieDictionary } from "./shared/ReformatCookies";
import { IPostofficeResponseData } from "./shared/PostofficeResponseData";
import { IPathTracker, PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";

export interface IExpectedUserResponse extends IPostofficeResponseData {
	Results: {
		token: string;
		username: string;
	};
}

export interface IRequestUserResponse {
	getCookies(): Cookies;
	getToken(): string;
}

export class RequestUserResponse implements IRequestUserResponse {
	private cookies: Cookies;
	private token: string;

	private constructor(buildData: { cookies: Cookies; token: string }) {
		this.cookies = buildData.cookies;
		this.token = buildData.token;
	}

	getCookies() {
		return { ...this.cookies };
	}

	getToken() {
		return this.token;
	}

	static Builder = class {
		private cookies: Cookies;
		private token: string;
		private logger: ILogger;
		private pathStack: IPathTracker;

		constructor() {
			this.cookies = {
				ARRAffinity: "",
				ARRAffinitySameSite: "",
				CentralJWTCookie: "",
				GCLB: "",
			};
			this.token = "";
			this.pathStack = new PathStack().push("Request User Response Builder");
			this.logger = new WinstonClient({ pathStack: this.pathStack });
		}

		useAxiosResponse(
			rawResponse: Omit<
				AxiosResponse<IExpectedUserResponse, any>,
				"request" | "config"
			>
		) {
			const success = rawResponse.data?.Success ?? false;
			const cookiesString = rawResponse?.headers["set-cookie"];
			const token = rawResponse.data?.Results?.token;
			const faults: string[] = [];

			if (
				typeof success !== "boolean" ||
				(typeof success === "boolean" && !success)
			) {
				faults.push("user response status is failed");
			}
			if (!Array.isArray(cookiesString) || !cookiesString.length) {
				faults.push("user response contains no cookies string");
			}
			if (typeof token !== "string" || !token.length) {
				faults.push("user response data has no token");
			}
			if (faults.length)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.ThirdPartyAPI,
					message: "Extracted Response User Is Invalid",
					details: {
						API: "Post office users request",
						faults: faults.join(" | "),
						response: rawResponse,
					},
				});

			this.token = token;

			const partialCookies = constructCookieDictionary(cookiesString!);
			if (Object.keys(partialCookies).length != 4) {
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.ThirdPartyAPI,
					message: "Request User API response is missing some cookies",
					details: {
						API: "Post office users request",
						cookies: partialCookies,
					},
				});
			}
			this.cookies = partialCookies as Cookies;
			return this;
		}

		build() {
			return new RequestUserResponse({
				cookies: this.cookies,
				token: this.token,
			});
		}
	};
}
