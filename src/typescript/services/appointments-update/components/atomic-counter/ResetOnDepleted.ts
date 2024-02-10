import { ICounterSetup, NaturalNumbersCounterSetup } from './CounterSetup';
import { IIncrementalCounter, NaturalNumbersCounter } from './IncrementalCounter';

// #############################################################################################
// ### IResetOnDepleted ########################################################################
// #############################################################################################

// ########################################
// ### Contracts ##########################
// ########################################

export type DepletedCheckResponse = {
	isValidDepleted: boolean;
	isFirstDepleted: boolean;
	aboveRequestLimit: boolean;
};

export interface IResetOnDepleted {
	isValidDepleted(requestLimit: number): DepletedCheckResponse;
	resetDepletedCounter(): void;
	resetRequestCounter(): void;
}

// ########################################
// ### Implementations ####################
// ########################################

/**
 * This will be used by Ip Manager in order to handle a 'depleted' message from Branch-updater.
 * 1. Verify if a 'depleted' message id valid.
 * 2. Reset first-depleted counter.
 * 3. Reset request-batch counter to batch-size.
 */

export class VerifyDepletedMessage implements IResetOnDepleted {
	private countDepletedMessages: IIncrementalCounter;
	private countRequest: IIncrementalCounter;
	private maxDepletedMessages = 50;
	private safetyMargin = this.maxDepletedMessages;

	constructor(data: ICounterSetup) {
		this.countDepletedMessages = new NaturalNumbersCounter(
			new NaturalNumbersCounterSetup({
				counterRange: { bottom: 0, top: this.maxDepletedMessages + this.safetyMargin },
			})
		);
		this.countRequest = new NaturalNumbersCounter(data);
	}

	isValidDepleted(requestLimit: number) {
		/*
		A valid-depleted is both:
		Request-counter has passed request limit, and
		This is the first depleted notice.*/
		let isFirstDepleted = false;
		let aboveRequestLimit = false;

		// Check if Request-counter has passed request limit.
		if (this.countRequest.peak().value > requestLimit) {
			aboveRequestLimit = true;
			// If this is the first depleted message.
			if (this.countDepletedMessages.increment().value === 1) {
				isFirstDepleted = true;
			}
		}

		return {
			isFirstDepleted,
			aboveRequestLimit,
			isValidDepleted: isFirstDepleted && aboveRequestLimit,
		};
	}

	resetDepletedCounter() {
		this.countDepletedMessages.reset(0);
	}

	resetRequestCounter() {
		this.countRequest.reset(0);
	}
}
