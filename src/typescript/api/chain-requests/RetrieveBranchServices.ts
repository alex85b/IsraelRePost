import { IBranchQnomycodePair, INewServiceRecord } from '../../data/elastic/BranchModel';
import { IErrorMapping } from '../../data/elastic/ErrorModel';
import { IApiRequestNode } from '../requests-as-nodes/IApiRequestNode';
import { UserNode } from '../requests-as-nodes/UserNode';
import { ProxyEndpoint } from '../../data/proxy-management/ProxyCollection';
import { CountAPIRequest } from '../../services/appointments-update/components/atomic-counter/ImplementCounters';

/**
 * Responsible for creating updated object representing a post office Branch's appointments.
 */
export class RetrieveBranchServices {
	// The structure of the appointment hierarchy is illustrated through comments for better understanding.

	// Root (Branch)
	// └── Service 1
	// |   └── Date 1.1
	// |       └── Time 1.1.1
	// |       └── Time 1.1.2
	// |       └── ...
	// |   └── Date 1.2
	// |   └── ...
	// └── Service 2
	// |   └── Date 2.1
	// |       └── Time 2.1.1
	// |       └── Time 2.1.2
	// |       └── ...
	// |   └── Date 2.2
	// |   └── ...
	// └── ...

	// An array of INewServiceRecord that needs to be built during runtime.
	private updatedServices: INewServiceRecord[] = [];

	// An array of Nodes; this will be used as a stack for DFS iteration.
	private stack: IApiRequestNode[] = [];

	// Branch Details for Israel post requests.
	private branchId: string;
	private qnomycode: number;

	// Shared Atomic Counters, for request counting.
	private requestCounter: CountAPIRequest;

	// A proxy setting for simultaneously handling a large volume of updates.
	private proxyEndpoint: ProxyEndpoint | undefined;

	// Object that represents the Current Branch's update-attempt errors,
	// This will be recorded at Elastic.
	private israelPostApiErrors: IErrorMapping = {
		userError: '',
		services: [],
	};

	private encounteredApiErrors: boolean = false;

	/**
	 * Creates an instance of BranchAppointment.
	 * @param options - An object containing the necessary options for initializing the class.
	 */
	constructor(options: RetrieveBranchServicesOptions) {
		// Initializes the RetrieveBranchServices instance with the provided options.
		this.branchId = options.branchCodePair.branchId;
		this.qnomycode = options.branchCodePair.qnomycode;
		this.requestCounter = options.requestCounter;
		this.proxyEndpoint = options.proxyEndpoint;
	}

	private resetMemory({ branchId, qnomycode }: IBranchQnomycodePair) {
		console.log('[Retrieve Branch Services][resetMemory]');
		this.updatedServices = [];
		this.stack = [];
		this.israelPostApiErrors = { userError: '', services: [] };
		this.branchId = branchId;
		this.qnomycode = qnomycode;
		this.encounteredApiErrors = false;
	}

	/**
	 * Sets up the stack for DFS iteration if it is empty.
	 */
	private setupStack() {
		console.log('[Retrieve Branch Services][setupStack]');
		if (this.stack.length === 0) {
			// Empty Stack --> Reset Error Flag.
			this.encounteredApiErrors = false;
			this.stack.push(
				new UserNode({
					memoryObjects: {
						IsraelPostApiErrors: this.israelPostApiErrors,
						updatedServices: this.updatedServices,
					},
					sharedCounter: {
						requestCounter: this.requestCounter,
					},
					updateData: { proxyEndpoint: this.proxyEndpoint, qnomycode: this.qnomycode },
				})
			);
		} else {
			throw Error('[Retrieve Branch Services][setupStack] node-stack is not empty');
		}
	}

	/**
	 * Executes DFS to perform a hierarchy of requests for updating appointments.
	 * @returns A string indicating the status of the update process ('Done' or 'Error' or 'Depleted').
	 */
	private async generateUpdatedAppointments() {
		console.log('[Retrieve Branch Services][generateUpdatedAppointments]');

		// Setup the stack for DFS iteration.
		if (!this.stack.length) this.setupStack();

		while (this.stack.length) {
			// Get the current (by DFS standards) request to perform.
			const node = this.stack.pop();
			if (!node) {
				break; // No more requests.
			}

			// Try to get child nodes of the current node,
			// Each child node is the 'Next-request' in the hierarchy.
			const childNodes = await node.getChildren();

			switch (childNodes) {
				case 'Depleted':
					// No more requests possible at this moment, due to API constraints.
					this.stack.unshift(node); // Return Node.
					return childNodes; // Stop iteration.
				case 'Done':
					break;
				case 'Errored':
					this.encounteredApiErrors = true;
					break;
				default:
					// add all child nodes to the stack.
					for (let index = childNodes.length - 1; index > -1; index--) {
						this.stack.push(childNodes[index]);
					}
					break;
			}
		}

		// All the needed requests are done.
		if (this.encounteredApiErrors) {
			// There was at least one error during the update.
			return 'Error';
		}
		// There has been no error during the update.
		return 'Done';
	}

	/**
	 * Gets the array of updated service records.
	 * @returns The array of updated service records.
	 */
	public getUpdatedAppointments() {
		return this.updatedServices;
	}

	/**
	 * Gets the object containing update-attempt errors.
	 * @returns The object containing update-attempt errors.
	 */
	public getUpdateErrors() {
		return this.israelPostApiErrors;
	}

	public getBranchData() {
		return { branchId: this.branchId, qnomycode: this.qnomycode };
	}

	public async performUpdate(branchCodePair?: IBranchQnomycodePair) {
		console.log('[performUpdate]');
		if (branchCodePair) {
			this.resetMemory(branchCodePair);
		}
		return await this.generateUpdatedAppointments();
	}

	public printAppointments() {
		console.log(`[Branch Appointments ${this.branchId}][Print Appointments] Start :`);
		this.updatedServices.forEach((service) => {
			console.log('serviceId : ', service.serviceId);
			console.log('serviceName : ', service.serviceName);
			service.dates.forEach((date) => {
				console.log('calendarDate : ', date.calendarDate);
				console.log('calendarId : ', date.calendarId);
				console.log('hours : ', date.hours);
			});
		});
		console.log('[Branch Appointments][Print Appointments] End.');
	}

	public printUpdateErrors() {
		console.log(`[Branch Appointments ${this.branchId}][Print Update Errors] Start :`);
		console.log('userError : ', this.israelPostApiErrors.userError);
		this.israelPostApiErrors.services.forEach((service) => {
			console.log('serviceId : ', service.serviceId);
			console.log('serviceError : ', service.serviceError);
			service.dates.forEach((date) => {
				console.log('calendarId : ', date.calendarId);
				console.log('datesError : ', date.datesError);
				console.log('timesError : ', date.timesError);
			});
		});
		console.log('[Branch Appointments][Print Update Errors] End.');
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

export interface RetrieveBranchServicesOptions {
	branchCodePair: IBranchQnomycodePair;
	proxyEndpoint?: ProxyEndpoint;
	requestCounter: CountAPIRequest;
}
