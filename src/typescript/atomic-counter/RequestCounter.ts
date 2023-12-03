import { AbstractAtomicCounter } from './AbstractAtomicCounter';

// Define options for configuring the RequestCounter class.
interface RequestCounterOptions {
	// SharedArrayBuffer for the atomic counter. Optional as it may be provided externally.
	arrayBuffer?: SharedArrayBuffer;
	// Flag indicating whether to reset the counter to 0 during initialization.
	reset: boolean;
}

// Create a class named RequestCounter that extends AbstractAtomicCounter with Uint8Array.
export class RequestCounter extends AbstractAtomicCounter<Uint8Array> {
	/**
	 * Constructor for the RequestCounter class.
	 * @param options - An object containing optional parameters for configuring the RequestCounter instance.
	 */
	constructor(options?: RequestCounterOptions) {
		// Destructure options or provide default values.
		const { reset, arrayBuffer } = options || {};

		// Call the constructor of the AbstractAtomicCounter with a SharedArrayBuffer and Uint8Array.
		super(arrayBuffer, Uint8Array);

		// If the reset flag is true, initialize the counter to 0.
		if (reset) {
			super.resetCount(0);
		}
	}

	/**
	 * Increment the request counter atomically and return the updated counter value.
	 * @returns An object with the updated request counter value.
	 */
	countRequest() {
		// Atomically increment the counter using the addAndGet method.
		const requestsCounter = super.addAndGet();

		// Return an object with the updated counter value.
		return { requestsCounter: requestsCounter + 1 };
	}
}
