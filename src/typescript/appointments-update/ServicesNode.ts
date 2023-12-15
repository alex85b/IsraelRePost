import { AxiosProxyConfig } from 'axios';
import { RequestCounter } from '../atomic-counter/RequestCounter';
import { RequestsAllowed } from '../atomic-counter/RequestsAllowed';
import { INewServiceRecord } from '../elastic/BranchModel';
import { IServiceError } from '../elastic/ErrorModel';
import { IApiRequestNode } from './IApiRequestNode';
import {
	IPostServiceRequired,
	IPostServicesResponse,
	PostServiceRequest,
} from '../isreal-post-requests/PostServiceRequest';
import { DatesNode, IDatesNodeData } from './DatesNode';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';

/**
 * Represents a node responsible for handling API requests related to services.
 */
export class ServicesNode implements IApiRequestNode {
	// A services request timeout value in milliseconds.
	private requestTimeout = 3000;

	// Represents the current request being made for the services.
	private currentRequest: PostServiceRequest;

	// This class will be used to construct the children of this node.
	private childNode = DatesNode;

	// Holds the data that will be saved to Elastic at the end of updating the branch's appointments.
	private memoryObjects;

	// Holds two shared atomic counters for tracking API requests.
	private sharedCounters;

	// Holds the data needed for performing the 'currentRequest'.
	private updateData;

	/**
	 * Creates an instance of ServicesNode.
	 * @param servicesNodeData - Data required for initializing the ServicesNode instance.
	 */
	constructor(servicesNodeData: IServicesNodeData) {
		// Initializes the ServicesNode instance with the provided data.
		this.memoryObjects = servicesNodeData.memoryObjects;
		this.sharedCounters = servicesNodeData.sharedCounters;
		this.updateData = servicesNodeData.updateData;
		this.currentRequest = new PostServiceRequest(
			this.requestTimeout,
			servicesNodeData.updateData.proxyEndpoint
		);
	}

	/**
	 * Prepares data required for a dates request.
	 * @param serviceId - The ID of the service for which data is prepared.
	 * @returns Data object for constructing a DatesNode.
	 */
	private setupDatesNodeData(serviceId: number): IDatesNodeData {
		// Prepare the data required for a dates request.
		const datesNodeData: IDatesNodeData = {
			updateData: {
				proxyEndpoint: this.updateData.proxyEndpoint,
				requestData: {
					headers: this.updateData.requestData.headers,
					url: { serviceId: String(serviceId) },
				},
			},
			memoryObjects: {
				// Pass only the dates[] of last 'service' from the array of 'updatedServices'.
				updatedDates:
					this.memoryObjects.updatedServices[
						this.memoryObjects.updatedServices.length - 1
					].dates,
				// Pass only the dates[] of last 'serviceError' from the array of 'servicesErrors'.
				DatesErrors:
					this.memoryObjects.servicesErrors[this.memoryObjects.servicesErrors.length - 1]
						.dates,
			},
			sharedCounters: {
				requestCounter: this.sharedCounters.requestCounter,
				requestsAllowed: this.sharedCounters.requestsAllowed,
			},
		};
		return datesNodeData;
	}

	/**
	 * Retrieves and returns the children nodes of this ServicesNode instance.
	 * @returns A Promise resolving to an array of child nodes, 'null', or 'Depleted' if no more requests are allowed.
	 */
	async getChildren(): Promise<DatesNode[] | 'Depleted' | 'Errored'> {
		let returnThis: DatesNode[] = [];
		try {
			// If no more requests allowed at this point, terminate updating.
			if (!this.sharedCounters.requestsAllowed.isAllowed()) {
				return 'Depleted';
			}
			// Count a new request.
			this.sharedCounters.requestCounter.countRequest();

			// Makes a service request to obtain necessary information.
			const services: IPostServicesResponse[] = await this.currentRequest.makeServiceRequest(
				this.updateData.requestData
			);

			if (services.length) {
				// Prepare an array that will hold child nodes.
				returnThis = [];

				for (const service of services) {
					// Populate 'updatedServices' with information retrieved for each service.
					// Each service serves as a 'root' for storing dates and appointment times.
					this.memoryObjects.updatedServices.push({
						serviceId: String(service.serviceId),
						serviceName: service.serviceName,
						dates: [],
					});

					// Populate 'servicesErrors' with information retrieved for each service.
					// Each service serves as a 'root' for potential errors related to dates or times.
					this.memoryObjects.servicesErrors.push({
						serviceId: String(service.serviceId),
						serviceError: '',
						dates: [],
					});

					// Add a new child node to the 'return' array.
					returnThis.push(new this.childNode(this.setupDatesNodeData(service.serviceId)));
				}
			}
		} catch (error) {
			// Handle service request errors and update error information accordingly.
			this.memoryObjects.servicesErrors.push({
				serviceError: (error as Error).message ?? 'No Message',
				serviceId: '',
				dates: [],
			});
			return 'Errored';
		}

		return returnThis;
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

// Represents the data structure expected for constructing a ServicesNode instance.
export interface IServicesNodeData {
	updateData: {
		proxyEndpoint: ProxyEndpoint | undefined;
		requestData: IPostServiceRequired;
	};
	memoryObjects: {
		updatedServices: INewServiceRecord[];
		servicesErrors: IServiceError[];
	};
	sharedCounters: {
		requestCounter: RequestCounter;
		requestsAllowed: RequestsAllowed;
	};
}
