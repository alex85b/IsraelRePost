import { IBranchQnomycodePair, INewServiceRecord } from '../elastic/BranchModel';
import { IErrorMapping } from '../elastic/ErrorModel';
import { AxiosProxyConfig } from 'axios';
import { RequestsAllowed } from '../atomic-counter/RequestsAllowed';
import { RequestCounter } from '../atomic-counter/RequestCounter';
import { IApiRequestNode } from './IApiRequestNode';
import { UserNode } from './UserNode';
import { ProxyEndpoint } from '../proxy-management/ProxyCollection';

/**
 * Responsible for creating updated object representing a post office Branch's appointments.
 */
export class BranchAppointment {
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
	private requestCounter: RequestCounter;
	private requestsAllowed: RequestsAllowed;

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
	constructor(options: BranchAppointmentOptions) {
		// Initializes the BranchAppointment instance with the provided options.
		this.branchId = options.branchCodePair.branchId;
		this.qnomycode = options.branchCodePair.qnomycode;
		this.requestCounter = options.requestCounter;
		this.requestsAllowed = options.requestsAllowed;
		this.proxyEndpoint = options.proxyEndpoint;
	}

	/**
	 * Sets up the stack for DFS iteration if it is empty.
	 */
	private setupStack() {
		if (this.stack.length === 0) {
			this.stack.push(
				new UserNode({
					memoryObjects: {
						IsraelPostApiErrors: this.israelPostApiErrors,
						updatedServices: this.updatedServices,
					},
					sharedCounters: {
						requestCounter: this.requestCounter,
						requestsAllowed: this.requestsAllowed,
					},
					updateData: { proxyEndpoint: this.proxyEndpoint, qnomycode: this.qnomycode },
				})
			);
		}
	}

	/**
	 * Executes DFS to perform a hierarchy of requests for updating appointments.
	 * @returns A string indicating the status of the update process ('Done' or 'Error' or 'Depleted').
	 */
	private async generateUpdatedAppointments() {
		// Setup the stack for DFS iteration.
		this.setupStack();

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
		if (
			this.israelPostApiErrors.userError !== '' ||
			this.israelPostApiErrors.services.length > 0
		) {
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
	getUpdatedAppointments() {
		return this.updatedServices;
	}

	/**
	 * Gets the object containing update-attempt errors.
	 * @returns The object containing update-attempt errors.
	 */
	getUpdateErrors() {
		return this.israelPostApiErrors;
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

export interface BranchAppointmentOptions {
	branchCodePair: IBranchQnomycodePair;
	proxyEndpoint?: ProxyEndpoint;
	requestsAllowed: RequestsAllowed;
	requestCounter: RequestCounter;
}
