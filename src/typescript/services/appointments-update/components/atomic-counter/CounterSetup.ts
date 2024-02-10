// #############################################################################################
// ### Contracts ###############################################################################
// #############################################################################################

export type MemoryView = Uint8Array | Uint16Array | Uint32Array;

export type CounterData = {
	memoryView: MemoryView;
	memoryBuffer: SharedArrayBuffer;
};

export type CounterRange = { bottom: number; top: number };

export type CounterSetupData =
	| { counterRange: CounterRange; readyData?: never }
	| { counterRange?: never; readyData: CounterData };

export interface ICounterSetup {
	getCounterData(): CounterData;
	setCounterData(setup: CounterRange): CounterData;
}

// #############################################################################################
// ### Implementations #########################################################################
// #############################################################################################

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
