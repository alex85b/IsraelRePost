import { IAxiosRequestSetup } from "../../api-requests/BranchRequest";
import { INode } from "./INode";
import { DatesRequest } from "../../api-requests/DatesRequest";
import { TimesNode } from "./TimesNode";
import { INewServiceRecord } from "../../interfaces/IDocumentBranch";

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
		private buildService: INewServiceRecord
	) {
		this.datesRequest = new DatesRequest();
	}

	async getChildren() {
		const newNodes: INode[] = [];
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
						this.buildService.dates[this.buildService.dates.length - 1].hours
					)
				);
			}
			return newNodes;
		}
		return null;
	}

	getRequestError() {
		return this.error;
	}

	getResponse() {
		return this.results;
	}
}
