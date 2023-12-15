export class AtomicCounter {
	private sharedArray: Int8Array;

	constructor(sharedArray?: Int8Array) {
		/**
		 * SharedArrayBuffer operates in bytes, byte = 8 bits.
		 * Translating Formula: 2^(bits amount) = base 10 number.
		 * Examples: 2^0 = 1, 2^1 = 2, 2^2 = 4, 2^3 = 8 ...
		 * In my case, i can only have 2^(8*1) = 256, 2^(8*2), 2^(8*3), ...
		 * I will only need -1 to 50, but i will get -128 to 127.
		 * What i want to get: new Int8Array(new SharedArrayBuffer(1)).
		 */
		if (sharedArray) this.sharedArray = sharedArray;
		else {
			this.sharedArray = new Int8Array(new SharedArrayBuffer(1));
		}
	}

	/**
	 * Takes an 8 bit array,
	 * First cell will be used as an atomic counter.
	 */
	set8BitCounter(array: Int8Array) {
		this.sharedArray = array;
	}

	/**
	 * Returns a counter, in a form of
	 * 8 Bit array.
	 */
	get8BitCounter() {
		return this.sharedArray;
	}

	resetCount(setCounter: number) {
		let actualSet = 48;
		if (setCounter < 128 && setCounter > -129) {
			actualSet = setCounter;
		}
		return Atomics.store(this.sharedArray, 0, actualSet);
	}

	subtractAndGet() {
		const subtractValue = 1;
		return Atomics.sub(this.sharedArray, 0, subtractValue);
	}
}
