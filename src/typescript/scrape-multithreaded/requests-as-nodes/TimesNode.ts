import { IAxiosRequestSetup } from "../../api-requests/BranchRequest";
import { INode } from "./INode";
import { TimesRequest } from "../../api-requests/TimesRequest";

export interface ITimesNodeData {
	headers: {
		authorization: string;
		cookies: {
			ARRAffinity: string;
			ARRAffinitySameSite: string;
			CentralJWTCookie: string;
			GCLB: string;
		};
	};
	url: { CalendarId: string; dayPart: string; ServiceId: string };
}

export class TimesNode implements INode {
	private timesRequest: TimesRequest;
	private error: Error | null = null;
	private results:
		| {
				Time: number;
		  }[] = [];
	constructor(
		private requestSetup: IAxiosRequestSetup,
		private timesNodeData: ITimesNodeData,
		private buildTimes: string[]
	) {
		this.timesRequest = new TimesRequest();
	}
	async getChildren() {
		const response = await this.timesRequest.generateResponse(
			this.timesNodeData,
			this.requestSetup
		);
		this.error = this.timesRequest.getError();
		if (response) {
			this.results = response.results;
			for (const time of this.results) {
				this.buildTimes.push(String(time.Time));
			}
		}
		return null;
	}

	getResponse() {
		return this.results;
	}

	getRequestError() {
		return this.error;
	}
}
