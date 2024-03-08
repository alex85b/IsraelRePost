import {
	BoundaryAwareIncrementalCounter,
	IBoundaryAwareCounter,
} from '../atomic-counter/BoundaryAwareCounter';
import { IArrayCounterSetup, ICounterSetup } from '../atomic-counter/CounterSetup';
import { CountResponse } from '../atomic-counter/IncrementalCounter';

// #############################################################################################
// ### LimitRequests ###########################################################################
// #############################################################################################

// ########################################
// ### Contracts ##########################
// ########################################

export type IsRequestAllowedResponse = {
	allowed: boolean;
	requestLeft: number | undefined;
	checkResponse: CountResponse;
};

export interface ILimitRequests {
	isAllowed(): IsRequestAllowedResponse;
	setRequestsLimit(newLimit: number): number;
	forgetLastValue(): void;
	getLastValues(): number;
}

export type LimitPerMinuteSetup = {
	setupData: ICounterSetup;
	limit: number;
};
// ########################################
// ### Implementations ####################
// ########################################

/**
 * This will be used by BranchUpdater, for:
 * 1. Notice no more request left in a current batch of allowed API requests.
 * 2. Count consumed requests in a current request batch.
 */

export class LimitPerMinute implements ILimitRequests {
	private countRequest: IBoundaryAwareCounter;
	private lastValue: number = -1;

	constructor(setupData: IArrayCounterSetup) {
		this.countRequest = new BoundaryAwareIncrementalCounter(setupData);
	}

	setRequestsLimit(newLimit: number): number {
		return this.countRequest.setBoundary(newLimit);
	}

	isAllowed(): IsRequestAllowedResponse {
		const response = this.countRequest.increment();

		/*
        Last value in local-memory is bigger than current value in the shared-memory,
        This indicates that shared-memory had a spill-over, and current request is not allowed.
        Return a 'not-allowed' response and do not reset local-memory*/
		if (this.lastValue >= response.actualValue) {
			// this.countRequest.setBoundary(0);
			this.countRequest.replaceExpectedBoundary(response.valueInMemory, 0); // 'Lock' the counter.
			return { allowed: false, requestLeft: undefined, checkResponse: response };
		}

		/*
        Last value in memory is below or equal to the allowed limit,
        Current request is allowed - return 'allowed' response*/
		if (response.actualValue <= response.valueInMemory) {
			this.lastValue = response.actualValue;
			return {
				allowed: true,
				requestLeft: response.valueInMemory - response.value,
				checkResponse: response,
			};
		}

		/*
        Last value in memory is above the allowed limit,
        Current request is not allowed - return 'not-allowed' response*/
		return {
			allowed: false,
			requestLeft: response.valueInMemory - response.value,
			checkResponse: response,
		};
	}

	forgetLastValue() {
		this.lastValue = -1;
	}

	getLastValues(): number {
		return this.lastValue;
	}
}
