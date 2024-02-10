import { ICounterSetup } from './CounterSetup';
import { CountResponse, IIncrementalCounter, NaturalNumbersCounter } from './IncrementalCounter';

// #############################################################################################
// ### CountRequest ############################################################################
// #############################################################################################

// ########################################
// ### Contracts ##########################
// ########################################

export type AllowedCheckResponse = {
	allowed: boolean;
	requestLeft: number | undefined;
	checkResponse: CountResponse;
};

export interface ICountRequest {
	isAllowed(limit: number): AllowedCheckResponse;
	reset(): void;
}

// ########################################
// ### Implementations ####################
// ########################################

/**
 * This will be used by BranchUpdater, for:
 * 1. Notice no more request left in a current batch of allowed API requests.
 * 2. Count consumed requests in a current request batch.
 */

export class CountAPIRequest implements ICountRequest {
	protected countRequest: IIncrementalCounter;

	constructor(data: ICounterSetup) {
		this.countRequest = new NaturalNumbersCounter(data);
	}

	isAllowed(limit: number) {
		const response = this.countRequest.increment();

		/*
        Last value in local-memory is bigger than current value in the shared-memory,
        This indicates that shared-memory had a spill-over, and current request is not allowed.
        Return a 'not-allowed' response and do not reset local-memory*/
		if (response.valueInMemory >= response.actualValue) {
			return { allowed: false, requestLeft: undefined, checkResponse: response };
		}

		/*
        Last value in memory is below or equal to the allowed limit,
        Current request is allowed - return 'allowed' response*/
		if (response.value <= limit)
			return { allowed: true, requestLeft: limit - response.value, checkResponse: response };

		/*
        Last value in memory is above the allowed limit,
        Current request is not allowed - return 'not-allowed' response*/
		return { allowed: false, requestLeft: limit - response.value, checkResponse: response };
	}

	reset() {
		this.countRequest.clearMemory();
	}
}
