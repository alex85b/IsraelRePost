import { RequestCounter } from '../../services/appointments-update/components/atomic-counter/RequestCounter';
import { RequestsAllowed } from '../../services/appointments-update/components/atomic-counter/RequestsAllowed';
import { INewDateEntryRecord } from '../../data/elastic/BranchModel';
import { IDateError } from '../../data/elastic/ErrorModel';
import { IApiRequestNode } from './IApiRequestNode';
import {
	IPostTimesRequired,
	IPostTimesResponse,
	PostTimesRequest,
} from '../isreal-post-requests/PostTimesRequest';
import { ProxyEndpoint } from '../../data/proxy-management/ProxyCollection';
import { CountAPIRequest } from '../../services/appointments-update/components/atomic-counter/ImplementCounters';

export class TimesNode implements IApiRequestNode {
	// A user request timeout value in milliseconds.
	private requestTimeout = 3000;

	// Represents the current request being made for the services.
	private currentRequest: PostTimesRequest;

	// Holds the data that will be saved to Elastic at the end of updating the branch's appointments.
	private memoryObjects;

	// Holds two shared atomic counters for tracking API requests.
	private sharedCounters;

	// Holds the data needed for performing the 'currentRequest'.
	private updateData;

	/**
	 * Creates an instance of TimesNode.
	 * @param datesNodeData - Data required for initializing the DatesNode instance.
	 */
	constructor(servicesNodeData: ITimesNodeData) {
		this.memoryObjects = servicesNodeData.memoryObjects;
		this.sharedCounters = servicesNodeData.sharedCounter;
		this.updateData = servicesNodeData.updateData;
		this.currentRequest = new PostTimesRequest(
			this.requestTimeout,
			servicesNodeData.updateData.proxyEndpoint
		);
	}

	// Retrieves and returns the children nodes of this ServicesNode instance.
	async getChildren(): Promise<'Depleted' | 'Errored' | 'Done'> {
		try {
			// If No more requests allowed at this point - Terminate updating.
			if (!this.sharedCounters.requestCounter.isAllowed()) {
				return 'Depleted';
			}

			// Makes a times request to obtain necessary information.
			const times: IPostTimesResponse[] = await this.currentRequest.makeTimesRequest(
				this.updateData.requestData
			);

			this.memoryObjects.updatedDate.hours = times.map((hour) => String(hour.Time));
		} catch (error) {
			// Handles errors that may occur during the times request and updates relevant error information.
			this.memoryObjects.DateError.timesError = (error as Error).message ?? 'No Message';
			return 'Errored';
		}

		return 'Done';
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

// Represents the data structure expected for constructing a ServicesNode instance.
export interface ITimesNodeData {
	updateData: {
		proxyEndpoint: ProxyEndpoint | undefined;
		requestData: IPostTimesRequired;
	};
	memoryObjects: {
		updatedDate: INewDateEntryRecord;
		DateError: IDateError;
	};
	sharedCounter: {
		requestCounter: CountAPIRequest;
	};
}
