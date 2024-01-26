// A class that utilizes a SharedArrayBuffer with a 'Typed Array' and atomic actions, to produce an atomic counter.
// Will be used to generate a shared-counter as 'SharedArrayBuffer' can be shared between threads.

export class AtomicCounter {
	// A shared memory buffer used by the AtomicCounter.
	// This is an actual 'Lump' of n-bytes of memory.
	private memoryBuffer: SharedArrayBuffer;

	private memoryView: Uint8Array | Uint16Array | Uint32Array;

	private biggestValue = 0;
	private smallestValue = 0;
	private maxCounterValue: number;

	constructor(maxCounterValue: number, memoryBuffer?: SharedArrayBuffer) {
		const memory = setupMemory(maxCounterValue, true, false, memoryBuffer);
		this.memoryBuffer = memory.memoryBuffer;
		if (!memory.memoryView) throw Error('[AtomicCounter][constructor] memoryView is undefined');
		this.memoryView = memory.memoryView;
		this.maxCounterValue = maxCounterValue;
	}

	/**
	 * Set a new shared memory buffer for the AtomicCounter.
	 * @param memoryBuffer - The new shared memory buffer.
	 */
	public setMemoryBuffer(memoryBuffer: SharedArrayBuffer) {
		this.memoryBuffer = memoryBuffer;
	}

	/**
	 * Get the current shared memory buffer used by the AtomicCounter.
	 * @returns The shared memory buffer.
	 */
	public getMemoryBuffer() {
		return this.memoryBuffer;
	}

	/**
	 * Reset the counter to a specified value within the valid range of T.
	 * @param setCounter - The value to set the counter to.
	 * @returns The result of the store operation.
	 */
	public resetCount(setCounter: number): IAtomicCounterResponse {
		const { biggestValue, smallestValue } = this.getCounterBounds();
		/*
		Creates limited actualSet, that fits within upper and lower boundaries.
		Result = Math.max(smallestValue, Q) limits function's Result to 'at least' smallestValue.
		Q = Math.min(setCounter, biggestValue) limits Q to be 'at best' as big as biggestValue.
		This limits actualSet between biggestValue and smallestValue values.
		*/
		let actualSet = Math.max(smallestValue, Math.min(setCounter, biggestValue));

		// Use Atomics to atomically store the value in the memory view
		if (setCounter === actualSet) {
			return { status: 'success', value: Atomics.store(this.memoryView, 0, setCounter) };
		} else return { status: 'stopped', value: Atomics.store(this.memoryView, 0, 0) };
	}

	/**
	 * This calculates the biggest and smallest number that can be represented in this counter.
	 * @returns Object that contains 'max counter value' and 'min counter value'.
	 */
	public getCounterBounds() {
		// Get the size of each element in the memory view array,
		// Can be 1 (Int8Array \ Uint8Array) or 2 or 4.
		const elementSize = this.memoryView.BYTES_PER_ELEMENT;

		// Check and notice if the memory view array is signed or unsigned.
		const isSigned =
			this.memoryView instanceof Int8Array ||
			this.memoryView instanceof Int16Array ||
			this.memoryView instanceof Int32Array;
		const reservedBit = isSigned ? 1 : 0;

		/*
		Calculate the biggest number that can be represented in base 10.
		2^8 (almost) converts a 8bit size number from base 2 to base 10.
		2^8 -1 converts a 8bit size number from base 2 to base 10, disregards 0.
		2^(8*n -1) -1 converts a (8*n)bit number while,
			reserving 1 bit for Signed, and disregarding 0.
		*/
		const biggestValue = Math.pow(2, 8 * elementSize - reservedBit) - 1;

		// Calculates the smallest number that can be represented in base 10.
		const smallestValue = isSigned ? -biggestValue - 1 : 0;

		this.biggestValue = biggestValue;
		this.smallestValue = smallestValue;
		return { biggestValue, maxCounterValue: this.maxCounterValue, smallestValue };
	}

	/**
	 * Atomically subtract a specified value from the counter.
	 * @returns The result of the subtraction operation.
	 */
	public subtractAndGet(subtract?: number): IAtomicCounterResponse {
		let subtractValue = 1;
		if (subtract) subtractValue = subtract;

		// Safeguard against subtracting below the minimal value.
		const current = Atomics.load(this.memoryView, 0);
		if (current - (subtract ?? 1) < this.smallestValue)
			return { status: 'stopped', value: current };

		// Use Atomics to atomically subtract the value from the memory view
		return {
			status: 'success',
			value: Atomics.sub(this.memoryView, 0, subtractValue) - subtractValue,
		};
	}

	/**
	 * Atomically add a specified value to the counter.
	 * @returns The result of the addition operation.
	 */
	public addAndGet(): IAtomicCounterResponse {
		const addValue = 1;

		// Safeguard against adding beyond the maximal value.
		const current = Atomics.load(this.memoryView, 0);
		if (current + addValue > this.biggestValue || current + addValue > this.maxCounterValue)
			return { status: 'stopped', value: current };

		// Use Atomics to atomically add the value to the memory view
		return { status: 'success', value: Atomics.add(this.memoryView, 0, addValue) + addValue };
	}

	isAtBoundary(): IAtBoundaryResponse {
		const current = Atomics.load(this.memoryView, 0);
		const atBoundary =
			current === this.maxCounterValue ||
			current === this.biggestValue ||
			current === this.smallestValue;

		return {
			atBoundary: atBoundary,
			upperBound: current === this.biggestValue,
			lowerBound: current === this.smallestValue,
		};
	}
}

// ###################################################################################################
// ### Interface #####################################################################################
// ###################################################################################################

export interface IAtomicCounterResponse {
	status: 'success' | 'stopped';
	value: number;
}

export interface IAtBoundaryResponse {
	atBoundary: boolean;
	upperBound: boolean;
	lowerBound: boolean;
}

// ###################################################################################################
// ### Helper Function ###############################################################################
// ###################################################################################################

export const setupMemory = (
	maxCounterValue: number,
	returnView: boolean,
	setMemoryValue: boolean,
	memoryBuffer?: SharedArrayBuffer
) => {
	let buffer;
	let memoryView;
	if (maxCounterValue <= 255 && maxCounterValue >= 0) {
		buffer = memoryBuffer ? memoryBuffer : new SharedArrayBuffer(1);
		memoryView = returnView ? new Uint8Array(buffer) : undefined;
	} else if (maxCounterValue <= 65535 && maxCounterValue >= 0) {
		buffer = memoryBuffer ? memoryBuffer : new SharedArrayBuffer(2);
		memoryView = returnView ? new Uint16Array(buffer) : undefined;
	} else if (maxCounterValue <= 4294967295 && maxCounterValue >= 0) {
		buffer = memoryBuffer ? memoryBuffer : new SharedArrayBuffer(4);
		memoryView = returnView ? new Uint32Array(buffer) : undefined;
	} else
		throw Error(
			`[AtomicCounter][setupMemory] Unsupported maxCounterValue : ${maxCounterValue}`
		);
	if (setMemoryValue && memoryView) memoryView[0] = maxCounterValue;
	return { memoryBuffer: buffer, memoryView };
};
