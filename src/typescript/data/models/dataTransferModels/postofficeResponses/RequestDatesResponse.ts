import { AxiosResponse } from "axios";
import { IPostofficeResponseData } from "./shared/PostofficeResponseData";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";

export interface IDatesResponseData {
	calendarDate: string;
	calendarId: number;
}

export interface IExpectedDatesResponse extends IPostofficeResponseData {
	Results: IDatesResponseData[];
}

export interface IRequestDatesResponse {
	getDates(): IDatesResponseData[];
	toString(): string;
}

export class RequestDatesResponse implements IRequestDatesResponse {
	private dates: IDatesResponseData[];

	private constructor(buildData: {
		postofficeServiceDates: IDatesResponseData[];
	}) {
		this.dates = buildData.postofficeServiceDates;
	}

	getDates() {
		return [...this.dates];
	}

	toString() {
		return this.dates
			.map((date) => {
				return [
					`Calendar ID: ${date.calendarId}`,
					`Calendar Date: ${date.calendarDate}`,
				].join("\n");
			})
			.join("\n\n");
	}

	static Builder = class {
		private dates: IDatesResponseData[] = [];
		private logger: ILogger;
		private pathStack: IPathTracker;

		constructor() {
			this.pathStack = new PathStack().push("Request Dates Response Builder");
			this.logger = new WinstonClient({ pathStack: this.pathStack });
		}

		useAxiosResponse(
			rawResponse: Omit<
				AxiosResponse<IExpectedDatesResponse, any>,
				"request" | "config"
			>
		) {
			const faults: string[] = [];
			const success = rawResponse.data?.Success ?? false;
			const dates = rawResponse.data?.Results;

			if (
				typeof success !== "boolean" ||
				(typeof success === "boolean" && !success)
			) {
				faults.push("dates response status indicates failure");
			}
			if (!Array.isArray(dates)) {
				faults.push("dates response array is malformed or does not exist");
			} else if (!dates.length) {
				faults.push("dates response contains no services");
			}
			if (faults.length) {
				faults.push(`response status: ${rawResponse.status}`);
				faults.push(`response statusText: ${rawResponse.statusText}`);
				faults.push(`response ErrorMessage: ${rawResponse.data.ErrorMessage}`);
				faults.push(`response ErrorNumber: ${rawResponse.data.ErrorNumber}`);
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.ThirdPartyAPI,
					message: "Extracted Response Data Is Invalid",
					details: {
						API: "Post office dates request",
						faults: faults.join(" | "),
						response: rawResponse,
					},
				});
			}

			if (dates.length) {
				const demoDate = dates[0];
				const calendarDate = demoDate.calendarDate;
				const calendarId = demoDate.calendarId;

				if (typeof calendarDate !== "string" || !calendarDate.length) {
					faults.push("dates response calendarDate is invalid");
				}
				if (typeof calendarId !== "number") {
					faults.push("dates response calendarId is invalid");
				}
				if (faults.length)
					throw new ServiceError({
						logger: this.logger,
						source: ErrorSource.ThirdPartyAPI,
						message: "Extracted Response Data Is Invalid",
						details: {
							API: "Post office dates request",
							faults: faults.join(" | "),
							response: rawResponse,
						},
					});
			}

			this.dates = dates;
			return this;
		}

		build() {
			return new RequestDatesResponse({ postofficeServiceDates: this.dates });
		}
	};
}
