import { INewServiceRecord } from '../elastic/BranchModel';
import { IErrorMapping } from '../elastic/ErrorModel';
import { IApiRequestNode } from './IApiRequestNode';
import { ServicesNode } from './ServicesNode';
import { PostUserRequest } from '../isreal-post-requests/PostUserRequest';
import { IPostServiceRequired } from '../isreal-post-requests/PostServiceRequest';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';
import { CountAPIRequest } from '../atomic-counter/ImplementCounters';

// Represents a node in the API request tree related to user data.
export class UserNode implements IApiRequestNode {
	// A user request timeout value in milliseconds.
	private requestTimeout = 3000;

	// This instance handles the necessary API requests for the user node.
	private currentRequest: PostUserRequest;

	// This class will be used to construct the children of this node.
	private childNode = ServicesNode;

	// Holds the data that will be saved to Elastic at the end of updating the branch's appointments.
	private memoryObjects;

	// Holds two shared atomic counters for tracking API requests.
	private sharedCounters;

	// Holds the data needed for performing the 'currentRequest'.
	private updateData;

	// Constructs a new UserNode instance.
	constructor(userNodeData: IUserNodeData) {
		this.memoryObjects = userNodeData.memoryObjects;
		this.sharedCounters = userNodeData.sharedCounter;
		this.updateData = userNodeData.updateData;
		this.currentRequest = new PostUserRequest(
			this.requestTimeout,
			userNodeData.updateData.proxyEndpoint
		);
	}

	// Asynchronously retrieves the children of this node.
	async getChildren(): Promise<ServicesNode[] | 'Depleted' | 'Errored'> {
		let returnThis: ServicesNode[] = [];
		try {
			// If No more requests allowed at this point - Terminate updating.
			if (!this.sharedCounters.requestCounter.isAllowed()) {
				return 'Depleted';
			}

			// Make a user request to obtain necessary data for constructing child nodes.
			const { ARRAffinity, ARRAffinitySameSite, CentralJWTCookie, GCLB, token } =
				await this.currentRequest.makeUserRequest();

			// Prepare the data required for a service request.
			const requestData: IPostServiceRequired = {
				url: {
					locationId: String(this.updateData.qnomycode),
					serviceTypeId: '0',
				},
				headers: {
					authorization: token,
					cookies: {
						ARRAffinity: ARRAffinity,
						ARRAffinitySameSite: ARRAffinitySameSite,
						CentralJWTCookie: CentralJWTCookie,
						GCLB: GCLB,
					},
				},
			};

			// Create an array containing a child node constructed with the obtained data.
			returnThis = [
				new this.childNode({
					memoryObjects: {
						// Pass the whole 'updatedServices' array.
						updatedServices: this.memoryObjects.updatedServices,
						// Pass Only the 'services' array of the 'IsraelPostApiErrors' Object.
						servicesErrors: this.memoryObjects.IsraelPostApiErrors.services,
					},
					sharedCounter: this.sharedCounters,
					updateData: { proxyEndpoint: this.updateData.proxyEndpoint, requestData },
				}),
			];
		} catch (error) {
			// Handle errors related to the user request and update the error information.
			this.memoryObjects.IsraelPostApiErrors.userError = (error as Error).message;
			return 'Errored';
		}

		return returnThis;
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

// Represents the data structure expected for constructing a UserNode instance.
export interface IUserNodeData {
	updateData: {
		proxyEndpoint: ProxyEndpoint | undefined;
		qnomycode: number; // This is a location code.
	};
	memoryObjects: {
		updatedServices: INewServiceRecord[];
		IsraelPostApiErrors: IErrorMapping;
	};
	sharedCounter: {
		requestCounter: CountAPIRequest;
	};
}
