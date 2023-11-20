import { IAxiosRequestSetup } from '../../api-requests/BranchRequest';
import { UserRequest } from '../../api-requests/UserRequest';
import { ServicesNode } from './ServicesNode';
import { INode } from './INode';
import { INewServiceRecord } from '../../elastic/BranchModel';
import { IErrorMapping } from '../../elastic/ErrorModel';

export interface IUserNodeData {
	requestSetup: IAxiosRequestSetup;
}

export class UserNode implements INode {
	private userRequest: UserRequest;

	private error: Error | null = null;
	private response: {
		token: string;
		CentralJWTCookie: string;
		ARRAffinity: string;
		ARRAffinitySameSite: string;
		GCLB: string;
	} = {
		ARRAffinity: 'none',
		ARRAffinitySameSite: 'none',
		CentralJWTCookie: 'none',
		GCLB: 'none',
		token: 'none',
	};

	constructor(
		private axiosSetup: IAxiosRequestSetup,
		private locationId: number,
		private buildServices: INewServiceRecord[],
		private branchErrors: IErrorMapping,
		private beforeRequest?: { id: number; callBack: (id: number) => Promise<void> }
	) {
		this.userRequest = new UserRequest();
	}

	async getChildren(): Promise<INode[] | null> {
		if (this.beforeRequest) this.beforeRequest.callBack(this.beforeRequest.id);
		const response = await this.userRequest.generateResponse(
			{ headers: {}, url: {} },
			this.axiosSetup
		);
		this.error = this.userRequest.getError();
		if (response) {
			this.response = response.data;
			const cookies = {
				ARRAffinity: response.data.ARRAffinity,
				ARRAffinitySameSite: response.data.ARRAffinitySameSite,
				CentralJWTCookie: response.data.CentralJWTCookie,
				GCLB: response.data.GCLB,
			};
			const headers = { authorization: response.data.token, cookies };
			return [
				new ServicesNode(
					this.axiosSetup,
					{
						headers,
						url: { locationId: String(this.locationId), serviceTypeId: '0' },
					},
					this.buildServices,
					this.branchErrors.services,
					this.beforeRequest
				),
			];
		}
		this.branchErrors.userError = this.error?.message ?? 'No-message';
		return null;
	}

	getResponse() {
		return [this.response];
	}

	getRequestError(): Error | null {
		throw this.error;
	}
}
