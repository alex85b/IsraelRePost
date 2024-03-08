// #############################################################################################
// ### Contracts ###############################################################################
// #############################################################################################

export type MemoryView = Uint8Array | Uint16Array | Uint32Array;

export type CounterData = {
	memoryView: MemoryView;
	memoryBuffer: SharedArrayBuffer;
};

export type CounterRange = { bottom: number; top: number };

export type CounterRangeAndLength = CounterRange & { length: number };

export type CounterSetupData =
	| { counterRange: CounterRange; readyData?: never }
	| { counterRange?: never; readyData: CounterData };

export type ArrayCounterSetupData =
	| { counterRangeAndLength: CounterRangeAndLength; readyData?: never }
	| { counterRangeAndLength?: never; readyData: CounterData };

export interface ICounterSetup {
	getCounterData(): CounterData;
	setCounterData(setup: CounterRange): CounterData;
}

export interface IArrayCounterSetup {
	getCounterData(): CounterData;
	getArrayLength(): number;
	setCounterData(setup: CounterRangeAndLength): CounterData;
	setCellValue(value: number, index: number): boolean;
}

// #############################################################################################
// ### Implementations #########################################################################
// #############################################################################################

// #####################################
// ### NaturalNumbersCounterSetup ######
// #####################################

export class NaturalNumbersCounterSetup implements ICounterSetup {
	private counterData: CounterData;

	constructor(setup: CounterSetupData) {
		if (setup.counterRange) {
			this.counterData = this.generateCounterData(setup.counterRange);
		} else {
			this.counterData = setup.readyData;
		}
	}

	private generateCounterData(setup: CounterRange): CounterData {
		let buffer;
		let memoryView;
		if (setup.top < 0)
			throw Error(
				`[AtomicCounter][setupMemory] Unsupported Counter Range Top : ${setup.top}`
			);
		if (setup.bottom < 0)
			throw Error(
				`[AtomicCounter][setupMemory] Unsupported Counter Range Bottom : ${setup.bottom}`
			);
		if (setup.bottom > setup.top)
			throw Error(
				`[AtomicCounter][setupMemory] Counter Range Bottom is above Top : ${setup}`
			);
		if (setup.top <= 255) {
			buffer = new SharedArrayBuffer(1);
			memoryView = new Uint8Array(buffer);
		} else if (setup.top <= 65535) {
			buffer = new SharedArrayBuffer(2);
			memoryView = new Uint16Array(buffer);
		} else if (setup.top <= 4294967295) {
			buffer = new SharedArrayBuffer(4);
			memoryView = new Uint32Array(buffer);
		} else
			throw Error(
				`[AtomicCounter][setupMemory] Unsupported Counter Range Top : ${setup.top}`
			);

		return {
			memoryBuffer: buffer,
			memoryView: memoryView,
		};
	}

	getCounterData(): CounterData {
		return this.counterData;
	}

	setCounterData(setup: CounterRange): CounterData {
		this.counterData = this.generateCounterData(setup);
		return this.counterData;
	}
}

// #####################################
// ### NaturalNumbersArraySetup ########
// #####################################

export class NaturalNumbersArraySetup implements IArrayCounterSetup {
	private counterData: CounterData;

	constructor(setup: ArrayCounterSetupData) {
		if (setup.counterRangeAndLength) {
			this.counterData = this.generateCounterData(setup.counterRangeAndLength);
		} else {
			this.counterData = setup.readyData;
		}
	}

	setCellValue(value: number, index: number): boolean {
		if (index < 0 || index > (this.getArrayLength() === 0 ? 0 : this.getArrayLength() - 1))
			return false;
		const elementSize = this.counterData.memoryView.BYTES_PER_ELEMENT;
		const max = Math.pow(2, 8 * elementSize /* -1 reserved bit in case of Unsigned */) - 1;
		if (value > max || value < 0) return false;
		this.counterData.memoryView[index] = value;
		return true;
	}

	getArrayLength(): number {
		if (this.counterData.memoryBuffer) {
			const byteSize = this.counterData.memoryView.BYTES_PER_ELEMENT;
			return this.counterData.memoryBuffer.byteLength / byteSize;
		}
		return 0;
	}

	private generateCounterData(setup: CounterRangeAndLength): CounterData {
		let buffer;
		let memoryView;
		if (setup.top < 0)
			throw Error(
				`[AtomicCounter][setupMemory] Unsupported Counter Range Top : ${setup.top}`
			);
		if (setup.bottom < 0)
			throw Error(
				`[AtomicCounter][setupMemory] Unsupported Counter Range Bottom : ${setup.bottom}`
			);
		if (setup.bottom > setup.top)
			throw Error(
				`[AtomicCounter][setupMemory] Counter Range Bottom is above Top : ${setup}`
			);
		if (setup.top <= 255) {
			buffer = new SharedArrayBuffer(1 * setup.length);
			memoryView = new Uint8Array(buffer);
		} else if (setup.top <= 65535) {
			buffer = new SharedArrayBuffer(2 * setup.length);
			memoryView = new Uint16Array(buffer);
		} else if (setup.top <= 4294967295) {
			buffer = new SharedArrayBuffer(4 * setup.length);
			memoryView = new Uint32Array(buffer);
		} else
			throw Error(
				`[AtomicCounter][setupMemory] Unsupported Counter Range Top : ${setup.top}`
			);

		return {
			memoryBuffer: buffer,
			memoryView: memoryView,
		};
	}

	getCounterData(): CounterData {
		return this.counterData;
	}

	setCounterData(setup: CounterRangeAndLength): CounterData {
		this.counterData = this.generateCounterData(setup);
		return this.counterData;
	}
}
