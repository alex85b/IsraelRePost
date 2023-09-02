import { IAxiosRequestSetup } from "../../api-requests/BranchRequest";
import { INode } from "./INode";
import { ServicesRequest } from "../../api-requests/ServicesRequest";
import { DatesNode } from "./DatesNode";
import { INewServiceRecord, IServiceError } from "../../elastic/elstClient";

export interface IServiceNodeData {
	headers: {
		authorization: string;
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		};
	};
	url: { locationId: string; serviceTypeId: string };
}

export class ServicesNode implements INode {
	private serviceRequest: ServicesRequest;
	private error: Error | null = null;
	private results: {
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
	}[] = [];

	constructor(
		private requestSetup: IAxiosRequestSetup,
		private serviceNodeData: IServiceNodeData,
		private buildServices: INewServiceRecord[],
		private branchErrors: IServiceError[],
		private beforeRequest?: { id: number; callBack: (id: number) => Promise<void> }
	) {
		this.serviceRequest = new ServicesRequest();
	}

	async getChildren() {
		const newNodes: INode[] = [];
		if (this.beforeRequest) this.beforeRequest.callBack(this.beforeRequest.id);
		const response = await this.serviceRequest.generateResponse(
			this.serviceNodeData,
			this.requestSetup
		);
		this.error = this.serviceRequest.getError();
		if (response) {
			this.results = response.results;
			for (const service of this.results) {
				this.buildServices.push({
					serviceId: String(service.serviceId),
					serviceName: service.serviceName,
					dates: [],
				});
				this.branchErrors.push({
					dates: [],
					serviceId: String(service.serviceId),
					serviceError: "",
				});
				newNodes.push(
					new DatesNode(
						this.requestSetup,
						{
							headers: this.serviceNodeData.headers,
							url: { serviceId: String(service.serviceId) },
						},
						this.buildServices[this.buildServices.length - 1],
						this.branchErrors[this.branchErrors.length - 1].dates,
						this.beforeRequest
					)
				);
			}
			return newNodes;
		}
		this.branchErrors.push({
			serviceError: this.error?.message ?? "No-message",
			dates: [],
			serviceId: "",
		});
		return null;
	}

	getResponse() {
		return this.results;
	}

	getRequestError() {
		return this.error;
	}
}
