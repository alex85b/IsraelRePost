import { AtomicCounter, setupMemory } from './AtomicCounter';
import { ICounterSetup, NaturalNumbersCounterSetup } from './CounterSetup';
import { IIncrementalCounter, NaturalNumbersCounter } from './IncrementalCounter';

/**
 * Classes that implement IIncrementalCounter, to prevent possible race conditions.
 */

/**
 * This allows to track remaining request-batches in the total-request pool.
 * 1. Sets up a total-requests counter on contraction.
 * 2. Tries to decrease total-requests by provided batch-size.
 * 3. Allows to change the size of the request-batch size.
 */

export interface ICountRequestBatch {}

export class CountRequestsBatch {
	private countRequestsBatch: AtomicCounter;

	constructor(totalRequests: number, private batchSize: number) {
		this.countRequestsBatch = new AtomicCounter(totalRequests);
		this.countRequestsBatch.resetCount(totalRequests);
	}

	setBatchSize(batchSize: number) {
		this.batchSize = batchSize;
	}

	countConsumedRequests() {
		const qwe = this.countRequestsBatch.subtractAndGet(this.batchSize);
		const { status, value } = qwe;
		return qwe;
	}
}

/**
 * Constructs a memory-buffer and memory-view that can contain provided batch-size number.
 * Will be used to construct a counter of requests in a request-batch.
 */
export class APIRequestCounterData {
	public buffer: SharedArrayBuffer;
	public view: Uint8Array | Uint16Array | Uint32Array;

	constructor(public batchSize: number) {
		const { memoryBuffer, memoryView } = setupMemory(batchSize, true, true);
		this.buffer = memoryBuffer;
		if (!memoryView)
			throw Error('[API Request Counter Data][constructor] memoryView is undefined');
		this.view = memoryView;
	}
}

/**
 * This will be used by BranchUpdater, for:
 * 1. Notice no more request left in a current batch of allowed API requests.
 * 2. Count consumed requests in a current request batch.
 */
export class CountAPIRequest {
	protected countRequest: AtomicCounter;

	constructor(data: APIRequestCounterData) {
		this.countRequest = new AtomicCounter(data.batchSize);
	}

	isAllowed() {
		const response = this.countRequest.subtractAndGet();
		// console.log('[CountAPIRequest][isAllowed] .subtractAndGet() : ', response);
		if (response.status === 'success') return { allowed: true, requestLeft: response.value };
		return { allowed: false, requestLeft: response.value };
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IManageRequestsData {
	totalRequests: number;
	batchSize: number;
}
