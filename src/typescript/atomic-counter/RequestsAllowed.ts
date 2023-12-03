import { AbstractAtomicCounter } from './AbstractAtomicCounter';

interface RequestsAllowedOptions {
	allowedRequests?: number;
	arrayBuffer?: SharedArrayBuffer;
}

// Create a class named RequestsAllowed that extends AbstractAtomicCounter with Int8Array.
export class RequestsAllowed extends AbstractAtomicCounter<Int8Array> {
	/**
	 * Constructor for the RequestsAllowed class.
	 * @param options - An object containing optional parameters for the initial number of allowed requests and the shared memory buffer.
	 */
	constructor(options?: RequestsAllowedOptions) {
		// Extract options or provide default values
		const { allowedRequests, arrayBuffer } = options || {};

		// Call the constructor of the AbstractAtomicCounter with a SharedArrayBuffer and Int8Array.
		super(arrayBuffer, Int8Array);

		// Check if allowedRequests is provided and not undefined or null.
		if (allowedRequests !== undefined && allowedRequests !== null) {
			// If allowedRequests is provided, reset the counter to the specified number of allowed requests.
			super.resetCount(allowedRequests);
		}
	}

	/**
	 * Checks if there are requests allowed and retrieves the updated counter value.
	 * @returns An object with information about the permission status and the current counter value.
	 *          - If allowed: { allowed: true, requestsCounter: updatedCounterValue }.
	 *          - If not allowed: { allowed: false, requestsCounter: updatedCounterValue }.
	 */
	isAllowed() {
		// Atomically subtract 1 from the counter and get the result.
		const requestsCounter = super.subtractAndGet();

		// If requestsCounter is less than or equal to 1, it means that 0 requests are left.
		if (requestsCounter <= 1) {
			return { allowed: false, requestsCounter: requestsCounter - 1 };
		}

		// Otherwise, there are requests allowed.
		return { allowed: true, requestsCounter: requestsCounter - 1 };
	}
}
