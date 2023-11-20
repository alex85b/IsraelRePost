import { IAxiosRequestSetup } from '../../api-requests/BranchRequest';
import { INode } from './INode';
import { TimesRequest } from '../../api-requests/TimesRequest';
import { IDateError } from '../../elastic/ErrorModel';

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
		private buildTimes: string[],
		private branchErrors: IDateError,
		private beforeRequest?: { id: number; callBack: (id: number) => Promise<void> }
	) {
		this.timesRequest = new TimesRequest();
	}
	async getChildren() {
		if (this.beforeRequest) this.beforeRequest.callBack(this.beforeRequest.id);
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
		} else {
			this.branchErrors.timesError = this.error?.message ?? 'No-message';
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
