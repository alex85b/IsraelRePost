import { AxiosResponse } from "axios";
import { IPostofficeResponseData } from "./shared/PostofficeResponseData";
import { IPathTracker, PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";

export interface IServicesResponseData {
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

export interface IExpectedServiceResponse extends IPostofficeResponseData {
	Results: IServicesResponseData[];
}

export interface IRequestServicesResponse {
	getServices(): IServicesResponseData[];
	toString(): string;
}

export class RequestServicesResponse implements IRequestServicesResponse {
	private services: IServicesResponseData[];

	private constructor(buildData: {
		postofficeBranchServices: IServicesResponseData[];
	}) {
		this.services = buildData.postofficeBranchServices;
	}

	getServices() {
		return [...this.services];
	}

	toString() {
		return this.services
			.map((service) => {
				return [
					`Service ID: ${service.serviceId}`,
					`Service Name: ${service.serviceName}`,
					`Service Description: ${service.serviceDescription}`,
					`Service Type ID: ${service.ServiceTypeId}`,
					`Service Type Description: ${service.serviceTypeDescription}`,
					`Description: ${service.description}`,
					`Show Stats: ${service.showStats}`,
					`Waiting Time: ${service.waitingTime}`,
					`Has Calendar Service: ${service.HasCalendarService}`,
					`Dynamic Forms Enabled: ${service.DynamicFormsEnabled}`,
					`Has FIFO Service: ${service.HasFIFOService}`,
					`Ext Ref: ${service.ExtRef}`,
					`Location ID: ${service.LocationId}`,
				].join("\n");
			})
			.join("\n\n");
	}

	static Builder = class {
		private services: IServicesResponseData[] = [];
		private logger: ILogger;
		private pathStack: IPathTracker;

		constructor() {
			this.pathStack = new PathStack().push(
				"Request Services Response Builder"
			);
			this.logger = new WinstonClient({ pathStack: this.pathStack });
		}

		useAxiosResponse(
			rawResponse: Omit<
				AxiosResponse<IExpectedServiceResponse, any>,
				"request" | "config"
			>
		) {
			const faults: string[] = [];
			const success = rawResponse.data?.Success ?? false;
			const services = rawResponse.data?.Results;

			if (
				typeof success !== "boolean" ||
				(typeof success === "boolean" && !success)
			) {
				faults.push(
					"services request has failed" +
						(rawResponse.statusText ? ", " + rawResponse.statusText : "")
				);
			}
			if (!Array.isArray(services)) {
				faults.push("services array is malformed or does not exist");
			} else if (!services.length) {
				faults.push("response contains no services");
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
						API: "Post office services request",
						faults: faults.join(" | "),
						response: rawResponse,
					},
				});
			}

			const demoService = services[0];
			const serviceId = demoService.serviceId;

			if (typeof serviceId !== "number") {
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.ThirdPartyAPI,
					message: "Service ID is invalid",
					details: {
						API: "Post office services request",
						response: rawResponse,
					},
				});
			}

			this.services = services;
			return this;
		}

		build() {
			return new RequestServicesResponse({
				postofficeBranchServices: this.services,
			});
		}
	};
}
