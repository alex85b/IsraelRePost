// import { Mutex } from 'async-mutex';

// // #############################################################################################
// // ### LimitRequestsBatch ######################################################################
// // #############################################################################################

// // ########################################
// // ### Contracts ##########################
// // ########################################

// export type IsBatchAllowedResponse = {
// 	allowed: boolean;
// 	requestLeft: number;
// };

// export interface ILimitRequestsBatch {
// 	setBatchSize(batchSize: number): Promise<void>;
// 	isAllowed(): Promise<IsBatchAllowedResponse>;
// }

// // #############################################################################################
// // ### Implementations #########################################################################
// // #############################################################################################

// /**
//  * This allows to track remaining request-batches in the total-request pool.
//  * 1. Sets up a total-requests counter on contraction.
//  * 2. Tries to decrease total-requests by provided batch-size.
//  * 3. Allows to change the size of the request-batch size.
//  */

// export class LimitPerHour implements ILimitRequestsBatch {
// 	private mute: Mutex;

// 	constructor(private totalRequests: number, private batchSize: number) {
// 		this.mute = new Mutex();
// 	}

// 	async setBatchSize(batchSize: number) {
// 		await this.mute.acquire().then((release) => {
// 			this.batchSize = batchSize;
// 			release();
// 		});
// 	}

// 	async isAllowed() {
// 		const returnThis: IsBatchAllowedResponse = {
// 			allowed: false,
// 			requestLeft: this.totalRequests,
// 		};
// 		await this.mute.acquire().then((release) => {
// 			if (this.totalRequests - this.batchSize > -1) {
// 				this.totalRequests = this.totalRequests - this.batchSize;
// 				returnThis.allowed = true;
// 				returnThis.requestLeft = this.totalRequests;
// 			}
// 			release();
// 		});
// 		return returnThis;
// 	}
// }
