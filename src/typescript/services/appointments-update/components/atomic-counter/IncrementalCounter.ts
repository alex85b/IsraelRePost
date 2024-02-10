import { CounterData, ICounterSetup } from './CounterSetup';

// #############################################################################################
// ### Contracts ###############################################################################
// #############################################################################################

export type CountResponse = {
	actualValue: number;
	value: number;
	valueInMemory: number;
};

export interface IIncrementalCounter {
	increment(): CountResponse;
	reset(value: number): CountResponse;
	clearMemory(): void;
	peak(): CountResponse;
	getLimits(): { max: number; min: number };
}

// #############################################################################################
// ### Implementations #########################################################################
// #############################################################################################

export class NaturalNumbersCounter implements IIncrementalCounter {
	private counterData: CounterData;
	private previous: number;
	private current: number;

	constructor(counterSetup: ICounterSetup) {
		this.counterData = counterSetup.getCounterData();
		this.current = 0;
		this.previous = 0;
	}

	getLimits(): { max: number; min: number } {
		const elementSize = this.counterData.memoryView.BYTES_PER_ELEMENT;
		const max = Math.pow(2, 8 * elementSize /* -1 reserved bit in case of Unsigned */) - 1;
		const min = 0;
		return { max, min };
	}

	peak(): CountResponse {
		const actualValue = Atomics.load(this.counterData.memoryView, 0);
		return { actualValue, value: actualValue + 1, valueInMemory: this.previous };
	}

	increment(): CountResponse {
		this.previous = this.current;
		this.current = Atomics.add(this.counterData.memoryView, 0, 1);
		return { actualValue: this.current, value: this.current + 1, valueInMemory: this.previous };
	}

	reset(value: number): CountResponse {
		this.current = Atomics.store(this.counterData.memoryView, 0, value);
		this.previous = this.current;
		return { actualValue: this.current, value: this.current + 1, valueInMemory: this.previous };
	}

	clearMemory() {
		this.current = 0;
		this.previous = this.current;
	}
}
