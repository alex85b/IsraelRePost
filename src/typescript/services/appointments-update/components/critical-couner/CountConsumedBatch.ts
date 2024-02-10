import { Mutex } from 'async-mutex';

// #############################################################################################
// ### Contracts ###############################################################################
// #############################################################################################

export type CountBatchResponse = {
	status: 'stopped' | 'success';
	value: number;
};

export interface ICountConsumedBatch {
	setBatchSize(batchSize: number): Promise<void>;
	countConsumedBatch(): Promise<CountBatchResponse>;
}

// #############################################################################################
// ### Implementations #########################################################################
// #############################################################################################

/**
 * This allows to track remaining request-batches in the total-request pool.
 * 1. Sets up a total-requests counter on contraction.
 * 2. Tries to decrease total-requests by provided batch-size.
 * 3. Allows to change the size of the request-batch size.
 */

export class ConsumeRequestBatch implements ICountConsumedBatch {
	private mute: Mutex;

	constructor(private totalRequests: number, private batchSize: number) {
		this.mute = new Mutex();
	}

	async setBatchSize(batchSize: number) {
		await this.mute.acquire().then((release) => {
			this.batchSize = batchSize;
			release();
		});
	}

	async countConsumedBatch() {
		const returnThis: CountBatchResponse = {
			status: 'stopped',
			value: this.totalRequests,
		};
		await this.mute.acquire().then((release) => {
			if (this.totalRequests - this.batchSize > -1) {
				this.totalRequests = this.totalRequests - this.batchSize;
				returnThis.status = 'success';
				returnThis.value = this.totalRequests;
			}
			release();
		});
		return returnThis;
	}
}
