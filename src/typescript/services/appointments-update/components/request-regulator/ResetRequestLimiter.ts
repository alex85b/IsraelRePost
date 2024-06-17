// import {
// 	BoundaryAwareIncrementalCounter,
// 	IBoundaryAwareCounter,
// } from '../atomic-counter/BoundaryAwareCounter';
// import {
// 	IArrayCounterSetup,
// 	ICounterSetup,
// 	NaturalNumbersCounterSetup,
// } from '../atomic-counter/CounterSetup';
// import { IIncrementalCounter, NaturalNumbersCounter } from '../atomic-counter/IncrementalCounter';

// // #############################################################################################
// // ### ResetRequestLimiter #####################################################################
// // #############################################################################################

// // ########################################
// // ### Contracts ##########################
// // ########################################

// export type DepletedCheckResponse = {
// 	isValidDepleted: boolean;
// 	isFirstDepleted: boolean;
// 	aboveRequestLimit: boolean;
// };

// // IResetRequestLimiter
// export interface IResetRequestLimiter {
// 	isValidDepleted(): DepletedCheckResponse;
// 	resetDepletedFlag(): void;
// 	resetRequestBatch(): void;
// }

// // ########################################
// // ### Implementations ####################
// // ########################################

// /**
//  * This will be used by Ip Manager in order to handle a 'depleted' message from Branch-updater.
//  * 1. Verify if a 'depleted' message id valid.
//  * 2. Reset first-depleted counter.
//  * 3. Reset request-batch counter to batch-size.
//  */

// export class ResetLimitPerMinute implements IResetRequestLimiter {
// 	private countDepletedMessages: IIncrementalCounter;
// 	private countRequest: IBoundaryAwareCounter;
// 	private maxDepletedMessages = 50;
// 	private safetyMargin = this.maxDepletedMessages;

// 	constructor(data: IArrayCounterSetup) {
// 		this.countDepletedMessages = new NaturalNumbersCounter(
// 			new NaturalNumbersCounterSetup({
// 				counterRange: { bottom: 0, top: this.maxDepletedMessages + this.safetyMargin },
// 			})
// 		);
// 		this.countRequest = new BoundaryAwareIncrementalCounter(data);
// 	}

// 	isValidDepleted() {
// 		/*
// 		A valid-depleted is both:
// 		Request-counter has passed request limit, and
// 		This is the first depleted notice.*/
// 		let isFirstDepleted = false;
// 		let aboveRequestLimit = false;

// 		// Check if Request-counter has passed request limit.
// 		if (this.countRequest.peak().value > this.countRequest.getBoundary()) {
// 			aboveRequestLimit = true;
// 			// If this is the first depleted message.
// 			if (this.countDepletedMessages.increment().value === 1) {
// 				isFirstDepleted = true;
// 			}
// 		}

// 		return {
// 			isFirstDepleted,
// 			aboveRequestLimit,
// 			isValidDepleted: isFirstDepleted && aboveRequestLimit,
// 		};
// 	}

// 	resetDepletedFlag() {
// 		this.countDepletedMessages.reset(0);
// 	}

// 	resetRequestBatch() {
// 		this.countRequest.setCounterValue(0);
// 	}
// }
