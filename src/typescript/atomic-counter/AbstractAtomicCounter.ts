export abstract class AbstractAtomicCounter<
	T extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
> {
	// A shared memory buffer used by the AtomicCounter.
	private memoryBuffer: SharedArrayBuffer;

	// An array view representing the memory buffer with a specified data type T.
	private memoryView: T;

	/**
	 * Creates an instance of AtomicCounter.
	 * @param memoryBuffer - Optional shared memory buffer. If not provided, a new buffer of size 1 is created.
	 * @param arrayType - Optional constructor for the array type T. Must accept an ArrayBuffer and return T.
	 */
	constructor(
		memoryBuffer?: SharedArrayBuffer,
		// arrayType has to be a constructor that returns T.
		arrayType?: new (buffer: ArrayBuffer) => T
	) {
		// Initialize the memory buffer.
		if (memoryBuffer) {
			this.memoryBuffer = memoryBuffer;
		} else {
			this.memoryBuffer = new SharedArrayBuffer(1);
		}

		// Create an instance of the specified array type or use Uint8Array as the default.
		// console.log('AbstractAtomicCounter - arrayType : ', arrayType);
		if (arrayType == undefined || arrayType == null) {
			this.memoryView = new Int8Array(this.memoryBuffer) as T;
		} else {
			this.memoryView = new arrayType(this.memoryBuffer);
		}
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
	public resetCount(setCounter: number) {
		// Get the size of each element in the typed array
		const elementSize = this.memoryView.BYTES_PER_ELEMENT;

		// Calculate the valid range based on the element size
		// 2 to the power of 8
		const maxCounterValue = Math.pow(2, 8 * elementSize - 1) - 1;
		const minCounterValue = -maxCounterValue - 1;

		/**
		 * Ensures that the specified counter value is within the valid range of the typed array T.
		 *
		 * @param'setCounter' is the requested value to set as counter.
		 * @returns Result:
		 * Result is set as maximal value between 'minCounterValue' and X,
		 * 	This insures that Result can't be below 'minCounterValue',
		 * X is the minimal value between 'maxCounterValue' and 'setCounter'
		 * 	This insures that X can't be higher then 'maxCounterValue'.
		 *
		 * Result will be set as 'setCounter' as long as
		 * 	it is between 'minCounterValue' and 'maxCounterValue'.
		 */
		let actualSet = Math.max(minCounterValue, Math.min(setCounter, maxCounterValue));

		// Use Atomics to atomically store the value in the memory view
		return Atomics.store(this.memoryView, 0, actualSet);
	}

	/**
	 * Atomically subtract a specified value from the counter.
	 * @returns The result of the subtraction operation.
	 */
	public subtractAndGet() {
		const subtractValue = 1;

		// Use Atomics to atomically subtract the value from the memory view
		return Atomics.sub(this.memoryView, 0, subtractValue);
	}

	/**
	 * Atomically add a specified value to the counter.
	 * @returns The result of the addition operation.
	 */
	public addAndGet() {
		const addValue = 1;

		// Use Atomics to atomically add the value to the memory view
		return Atomics.add(this.memoryView, 0, addValue);
	}
}
