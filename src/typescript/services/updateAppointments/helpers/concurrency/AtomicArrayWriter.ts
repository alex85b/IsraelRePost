import {
	MemoryView,
	IGetMemoryViewParameters,
} from '../../../../data/models/dataTransferModels/ThreadSharedMemory';

export type AtomicAddResponse = {
	beforeAddition: number;
	expectedAfterAddition: number;
};

export interface IAtomicArrayWriter {
	setCellValue(data: { cell: number; value: number }): boolean;
	replaceExpectedValue(data: { cell: number; expected: number; replaceWith: number }): boolean;
	peakCellValue(data: { cell: number }): number;
	addToCellValue(data: { cell: number; value: number }): AtomicAddResponse;
	getMemoryArrayData(): {
		memoryCellCount: number;
		memoryMaxCellValue: number;
		memoryMinCellValue: number;
	};
}

export class AtomicArrayWriter implements IAtomicArrayWriter {
	private memoryView: MemoryView;
	private memoryCellCount: number;
	private memoryMaxCellValue: number;
	private memoryMinCellValue: number;

	constructor(buildData: {
		memoryView: MemoryView;
		viewParametersExtractor: IGetMemoryViewParameters;
	}) {
		this.memoryView = buildData.memoryView;
		const { minCellValue, maxCellValue, cellCount } = buildData.viewParametersExtractor(
			this.memoryView
		);
		this.memoryCellCount = cellCount;
		this.memoryMaxCellValue = maxCellValue;
		this.memoryMinCellValue = minCellValue;
	}

	getMemoryArrayData(): {
		memoryCellCount: number;
		memoryMaxCellValue: number;
		memoryMinCellValue: number;
	} {
		return {
			memoryCellCount: this.memoryCellCount,
			memoryMaxCellValue: this.memoryMaxCellValue,
			memoryMinCellValue: this.memoryMinCellValue,
		};
	}

	private validateCellValue(data: { value: number; cellAlias?: string; faults: string[] }) {
		if (data.value > this.memoryMaxCellValue)
			data.faults.push(
				`${data.cellAlias ? data.cellAlias + ' ' : ''}value ${
					data.value
				} is above the limit ${this.memoryMaxCellValue}`
			);
		if (data.value < this.memoryMinCellValue)
			data.faults.push(
				`${data.cellAlias ? data.cellAlias + ' ' : ''}value ${
					data.value
				} is below the limit ${this.memoryMinCellValue}`
			);
	}

	private validateCellIndex(data: { index: number; faults: string[] }) {
		if (data.index > this.memoryCellCount - 1)
			data.faults.push(
				`index ${data.index} is above maximal index ${this.memoryCellCount - 1}`
			);
		if (data.index < 0) data.faults.push(`index ${data.index} is below minimal index 0`);
	}

	setCellValue(data: { cell: number; value: number }): boolean {
		const faults: string[] = [];
		this.validateCellIndex({ index: data.cell, faults });
		this.validateCellValue({ value: data.value, faults });
		if (faults.length) {
			throw Error('[AtomicArrayWriter][setCellValue] Faults : ' + faults.join(' | '));
		}
		if (Atomics.store(this.memoryView, data.cell, data.value) === data.value) return true;
		return false;
	}

	replaceExpectedValue(data: { cell: number; expected: number; replaceWith: number }): boolean {
		const faults: string[] = [];
		this.validateCellIndex({ index: data.cell, faults });
		this.validateCellValue({ cellAlias: 'expected', value: data.expected, faults });
		this.validateCellValue({ cellAlias: 'replaceWith', value: data.replaceWith, faults });
		if (faults.length) {
			throw Error('[AtomicArrayWriter][replaceExpectedValue] Faults : ' + faults.join(' | '));
		}
		const result = Atomics.compareExchange(
			this.memoryView,
			data.cell,
			data.expected,
			data.replaceWith
		);

		if (result === data.expected) return true;

		console.log(
			`[AtomicArrayWriter][replaceExpectedValue] Result-${result} memory view : `,
			this.memoryView
		);

		return false;
	}

	peakCellValue(data: { cell: number }): number {
		const faults: string[] = [];
		this.validateCellIndex({ index: data.cell, faults });
		if (faults.length) {
			throw Error('[AtomicArrayWriter][peakCellValue] Faults : ' + faults.join(' | '));
		}
		return Atomics.load(this.memoryView, data.cell);
	}

	addToCellValue(data: { cell: number; value: number }): AtomicAddResponse {
		// This is not protected from overflow !
		const faults: string[] = [];
		this.validateCellIndex({ index: data.cell, faults });
		this.validateCellValue({ value: data.value, faults });
		if (faults.length) {
			throw Error('[AtomicArrayWriter][addToCellValue] Faults : ' + faults.join(' | '));
		}
		const valueBeforeAdd = Atomics.add(this.memoryView, data.cell, data.value);
		return {
			beforeAddition: valueBeforeAdd,
			expectedAfterAddition: valueBeforeAdd + data.value,
		};
	}
}
