import { AtomicCounter, setupMemory } from './AtomicCounter';

/**
 * Classes that implement AtomicCounter, to provide thread-safe and asynchronous-safe counting.
 */

/**
 * This will be used by Ip Manager in order to handle a 'depleted' message from Branch-updater.
 * 1. Verify if a 'depleted' message id valid.
 * 2.
 */
export class VerifyDepletedMessage {
	private countDepletedMessages: AtomicCounter;
	protected countRequest: AtomicCounter;

	constructor(data: APIRequestCounterData) {
		this.countDepletedMessages = new AtomicCounter(1);
		this.countDepletedMessages.resetCount(0);
		this.countRequest = new AtomicCounter(data.batchSize, data.buffer);
	}

	isValidDepleted() {
		// If the request counter reached the boundary.
		const atBoundary = this.countRequest.isAtBoundary().lowerBound;
		// If this is the first depleted message.
		let isFirst = false;
		if (atBoundary)
			isFirst = this.countDepletedMessages.addAndGet().status === 'success' ? true : false;
		return {
			isValid: atBoundary && isFirst,
			lowestBoundary: atBoundary,
			isFirst: isFirst,
		};
	}

	resetDepletedCounter() {
		this.countDepletedMessages.resetCount(0);
	}

	resetRequestCounter(batchSize: number) {
		this.countDepletedMessages.resetCount(0);
	}
}

/**
 * This allows to track remaining request-batches in the total-request pool.
 * 1. Sets up a total-requests counter on contraction.
 * 2. Tries to decrease total-requests by provided batch-size.
 * 3. Allows to reset the batch-size by which total-requests are decreased.
 */
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
		return this.countRequestsBatch.subtractAndGet(this.batchSize);
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
		this.countRequest = new AtomicCounter(data.batchSize, data.buffer);
	}

	isAllowed() {
		const response = this.countRequest.subtractAndGet();
		if (response.status === 'success') return true;
		return false;
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IManageRequestsData {
	totalRequests: number;
	batchSize: number;
}
