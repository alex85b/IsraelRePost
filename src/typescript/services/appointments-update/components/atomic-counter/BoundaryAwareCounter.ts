// // #############################################################################################
// // ### Contracts ###############################################################################
// // #############################################################################################

// import { CounterData, IArrayCounterSetup } from './CounterSetup';

// export type CountResponse = {
// 	actualValue: number;
// 	value: number;
// 	valueInMemory: number;
// };

// export type CounterArrayLength = number;

// export interface IBoundaryAwareCounter {
// 	setBoundary(value: number): number;
// 	replaceExpectedBoundary(expected: number, replaceWith: number): number;
// 	getBoundary(): number;
// 	setCounterValue(value: number): CountResponse;
// 	increment(): CountResponse;
// 	peak(): CountResponse;
// 	getValueLimits(): { max: number; min: number };
// 	length(): CounterArrayLength;
// }

// // #############################################################################################
// // ### Implementations #########################################################################
// // #############################################################################################

// export class BoundaryAwareIncrementalCounter implements IBoundaryAwareCounter {
// 	private counterData: CounterData;

// 	constructor(setup: IArrayCounterSetup) {
// 		this.counterData = setup.getCounterData();
// 		if (setup.getArrayLength() < 2)
// 			throw Error('[IncrementAndVerify][constructor] buffer does not support 2 cells');
// 	}

// 	length(): CounterArrayLength {
// 		const elementSize = this.counterData.memoryView.BYTES_PER_ELEMENT;
// 		const bytesAmount = this.counterData.memoryBuffer.byteLength;
// 		return bytesAmount / elementSize;
// 	}

// 	setCounterValue(value: number): CountResponse {
// 		const { max, min } = this.getValueLimits();
// 		const peakedValue = Atomics.load(this.counterData.memoryView, 0);
// 		if (value > max || value < min) return this.peak();
// 		const actualValue = Atomics.store(this.counterData.memoryView, 0, 1);
// 		return {
// 			actualValue,
// 			value: actualValue + 1,
// 			valueInMemory: Atomics.load(this.counterData.memoryView, 1),
// 		};
// 	}

// 	increment(): CountResponse {
// 		const actualValue = Atomics.add(this.counterData.memoryView, 0, 1);
// 		return {
// 			actualValue,
// 			value: actualValue + 1,
// 			valueInMemory: Atomics.load(this.counterData.memoryView, 1),
// 		};
// 	}

// 	setBoundary(value: number): number {
// 		const { max, min } = this.getValueLimits();
// 		if (value > max || value < min) return -1;
// 		const newBoundaryValue = Atomics.store(this.counterData.memoryView, 1, value);
// 		return newBoundaryValue;
// 	}

// 	replaceExpectedBoundary(expected: number, replaceWith: number): number {
// 		const { max, min } = this.getValueLimits();
// 		if (replaceWith > max || replaceWith < min) return -1;
// 		const newBoundaryValue = Atomics.compareExchange(
// 			this.counterData.memoryView,
// 			1 /*Index*/,
// 			expected,
// 			replaceWith
// 		);
// 		return newBoundaryValue;
// 	}

// 	getBoundary(): number {
// 		return Atomics.load(this.counterData.memoryView, 1);
// 	}

// 	peak(): CountResponse {
// 		const actualValue = Atomics.load(this.counterData.memoryView, 0);
// 		return {
// 			actualValue,
// 			value: actualValue,
// 			valueInMemory: Atomics.load(this.counterData.memoryView, 1),
// 		};
// 	}

// 	getValueLimits(): { max: number; min: number } {
// 		const elementSize = this.counterData.memoryView.BYTES_PER_ELEMENT;
// 		const max = Math.pow(2, 8 * elementSize /* -1 reserved bit in case of Unsigned */) - 1;
// 		const min = 0;
// 		return { max, min };
// 	}
// }
