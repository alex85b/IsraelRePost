import { AxiosProxyConfig } from 'axios';
import { RequestCounter } from '../atomic-counter/RequestCounter';
import { RequestsAllowed } from '../atomic-counter/RequestsAllowed';
import { INewDateEntryRecord } from '../elastic/BranchModel';
import { IDateError } from '../elastic/ErrorModel';
import {
	IPostDatesRequired,
	IPostDatesResponse,
	PostDatesRequest,
} from '../isreal-post-requests/PostDatesRequest';
import { IApiRequestNode } from './IApiRequestNode';
import { ITimesNodeData, TimesNode } from './TimesNode';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';

/**
 * Represents a node responsible for handling API requests related to dates.
 */
export class DatesNode implements IApiRequestNode {
	// A user request timeout value in milliseconds.
	private requestTimeout = 3000;

	// Represents the current request being made for dates.
	private currentRequest: PostDatesRequest;

	// This class will be used to construct the children of this node.
	private childNode = TimesNode;

	// Holds the data that will be saved to Elastic at the end of updating the branch's appointments.
	private memoryObjects;

	// Holds two shared atomic counters for tracking API requests.
	private sharedCounters;

	// Holds the data needed for performing the 'currentRequest'.
	private updateData;

	/**
	 * Creates an instance of DatesNode.
	 * @param datesNodeData - Data required for initializing the DatesNode instance.
	 */
	constructor(datesNodeData: IDatesNodeData) {
		// Initializes the DatesNode instance with the provided data.
		this.memoryObjects = datesNodeData.memoryObjects;
		this.sharedCounters = datesNodeData.sharedCounters;
		this.updateData = datesNodeData.updateData;
		this.currentRequest = new PostDatesRequest(
			this.requestTimeout,
			datesNodeData.updateData.proxyEndpoint
		);
	}

	/**
	 * Prepares data required for a times request.
	 * @param calendarId - The ID of the calendar for which data is prepared.
	 * @param serviceId - The ID of the service for which data is prepared.
	 * @param dayPart - The part of the day for which times data is prepared.
	 * @returns Data object for constructing a TimesNode.
	 */
	private setupTimesNodeData(
		calendarId: string,
		serviceId: string,
		dayPart: string
	): ITimesNodeData {
		// Prepare the data required for a times request.
		const timesNodeData: ITimesNodeData = {
			updateData: {
				proxyEndpoint: this.updateData.proxyEndpoint,
				requestData: {
					headers: this.updateData.requestData.headers,
					url: { CalendarId: calendarId, ServiceId: serviceId, dayPart: dayPart },
				},
			},
			memoryObjects: {
				// Pass only the last 'date' from the array of 'updatedDates'.
				updatedDate:
					this.memoryObjects.updatedDates[this.memoryObjects.updatedDates.length - 1],
				// Pass only the last 'dateError' from the array of 'DatesErrors'.
				DateError:
					this.memoryObjects.DatesErrors[this.memoryObjects.DatesErrors.length - 1],
			},
			sharedCounters: {
				requestCounter: this.sharedCounters.requestCounter,
				requestsAllowed: this.sharedCounters.requestsAllowed,
			},
		};
		return timesNodeData;
	}

	/**
	 * Retrieves and returns the children nodes of this DatesNode instance.
	 * @returns A Promise resolving to an array of child nodes, 'null', or 'Depleted' if no more requests are allowed.
	 */
	async getChildren(): Promise<TimesNode[] | 'Depleted' | 'Errored'> {
		let returnThis: TimesNode[] = [];
		try {
			// If no more requests allowed at this point, terminate updating.
			if (!this.sharedCounters.requestsAllowed.isAllowed()) {
				return 'Depleted';
			}
			// Count a new request.
			this.sharedCounters.requestCounter.countRequest();

			// Makes a dates request to obtain necessary information.
			const dates: IPostDatesResponse[] = await this.currentRequest.makeDatesRequest(
				this.updateData.requestData
			);

			if (dates.length) {
				// Prepare an array that will hold child nodes.
				returnThis = [];

				for (const date of dates) {
					// Populate 'updatedDate' with dates in which there are open appointments.
					this.memoryObjects.updatedDates.push({
						calendarDate: date.calendarDate,
						calendarId: String(date.calendarId),
						hours: [],
					});

					// Populate 'DatesErrors' with information related to each retrieved date.
					this.memoryObjects.DatesErrors.push({
						calendarId: String(date.calendarId),
						datesError: '',
						timesError: '',
					});

					// Add a new child node to the 'return' array.
					returnThis.push(
						new this.childNode(
							this.setupTimesNodeData(
								String(date.calendarId),
								this.updateData.requestData.url.serviceId,
								'0'
							)
						)
					);
				}
			}
		} catch (error) {
			// Handle dates request errors and update error information accordingly.
			this.memoryObjects.DatesErrors.push({
				datesError: (error as Error).message ?? 'No Message',
				calendarId: '',
				timesError: '',
			});
			return 'Errored';
		}
		return returnThis;
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

// Represents the data structure expected for constructing a DatesNode instance.
export interface IDatesNodeData {
	updateData: {
		proxyEndpoint: ProxyEndpoint | undefined;
		requestData: IPostDatesRequired;
	};
	memoryObjects: {
		updatedDates: INewDateEntryRecord[];
		DatesErrors: IDateError[];
	};
	sharedCounters: {
		requestCounter: RequestCounter;
		requestsAllowed: RequestsAllowed;
	};
}