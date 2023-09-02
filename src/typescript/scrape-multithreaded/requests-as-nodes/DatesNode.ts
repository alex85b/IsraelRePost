import { IAxiosRequestSetup } from "../../api-requests/BranchRequest";
import { INode } from "./INode";
import { DatesRequest } from "../../api-requests/DatesRequest";
import { TimesNode } from "./TimesNode";
import { IDateError, INewServiceRecord } from "../../elastic/elstClient";

export interface IDatesNodeData {
	headers: {
		authorization: string;
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		};
	};
	url: { serviceId: string };
}

export class DatesNode implements INode {
	private datesRequest: DatesRequest;
	private error: Error | null = null;
	private results: {
		calendarDate: string;
		calendarId: number;
	}[] = [];

	constructor(
		private requestSetup: IAxiosRequestSetup,
		private datesNodeData: IDatesNodeData,
		private buildService: INewServiceRecord,
		private branchErrors: IDateError[],
		private beforeRequest?: { id: number; callBack: (id: number) => Promise<void> }
	) {
		this.datesRequest = new DatesRequest();
	}

	async getChildren() {
		const newNodes: INode[] = [];
		if (this.beforeRequest) this.beforeRequest.callBack(this.beforeRequest.id);
		const response = await this.datesRequest.generateResponse(
			this.datesNodeData,
			this.requestSetup
		);
		this.error = this.datesRequest.getError();
		if (response) {
			this.results = response.results;
			for (const date of this.results) {
				this.buildService.dates.push({
					calendarDate: date.calendarDate,
					calendarId: String(date.calendarId),
					hours: [],
				});
				this.branchErrors.push({
					calendarId: String(date.calendarId),
					datesError: "",
					timesError: "",
				});
				newNodes.push(
					new TimesNode(
						this.requestSetup,
						{
							headers: this.datesNodeData.headers,
							url: {
								CalendarId: String(date.calendarId),
								dayPart: "0",
								ServiceId: this.datesNodeData.url.serviceId,
							},
						},
						this.buildService.dates[this.buildService.dates.length - 1].hours,
						this.branchErrors[this.buildService.dates.length - 1],
						this.beforeRequest
					)
				);
			}
			return newNodes;
		}
		this.branchErrors.push({
			calendarId: "",
			timesError: "",
			datesError: this.error?.message ?? "No-message",
		});
		return null;
	}

	getRequestError() {
		return this.error;
	}

	getResponse() {
		return this.results;
	}
}
