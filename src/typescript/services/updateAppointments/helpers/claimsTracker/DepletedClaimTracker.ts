import {
	SharedMemoryBuilder,
	getMemoryViewParameters,
} from '../../../../data/models/dataTransferModels/ThreadSharedMemory';
import { AtomicArrayWriter, IAtomicArrayWriter } from '../concurrency/AtomicArrayWriter';

export type DepletedClaimsTrackerResponse = {
	authorized: boolean;
	beforeAddition: number;
	expectedAfterAddition: number;
	lastRequestNumber: number;
	overflowFlag: number;
};

export interface ITrackDepletedClaims {
	track(): DepletedClaimsTrackerResponse;
	reset(): void;
}

export class DepletedClaimsTracker implements ITrackDepletedClaims {
	private synchronization: IAtomicArrayWriter;
	private lastRequestNumber: number;

	constructor(args?: { synchronization: IAtomicArrayWriter }) {
		if (args && args.synchronization) this.synchronization = args.synchronization;
		else {
			this.synchronization = new AtomicArrayWriter({
				memoryView: new SharedMemoryBuilder()
					.maxMemoryCellValue(100)
					.neededCellAmount(2)
					.build(),
				viewParametersExtractor: getMemoryViewParameters,
			});
		}
		this.synchronization.setCellValue({ cell: 1, value: 0 });
		this.lastRequestNumber = -1;
	}

	track(): DepletedClaimsTrackerResponse {
		const incrementResult = this.synchronization.addToCellValue({ cell: 0, value: 1 });

		/*
        Current value after increment must be a bigger number, unless overflow ocurred*/
		if (incrementResult.expectedAfterAddition <= this.lastRequestNumber) {
			// Lock the tracking response to unotherized.
			this.synchronization.setCellValue({ cell: 1, value: 1 });
		} else this.lastRequestNumber = incrementResult.beforeAddition;

		if (
			incrementResult.beforeAddition === 0 &&
			this.synchronization.peakCellValue({ cell: 1 }) === 0
		) {
			return {
				authorized: true,
				beforeAddition: incrementResult.beforeAddition,
				expectedAfterAddition: incrementResult.expectedAfterAddition,
				overflowFlag: this.synchronization.peakCellValue({ cell: 1 }),
				lastRequestNumber: this.lastRequestNumber,
			};
		} else {
			return {
				authorized: false,
				beforeAddition: incrementResult.beforeAddition,
				expectedAfterAddition: incrementResult.expectedAfterAddition,
				overflowFlag: this.synchronization.peakCellValue({ cell: 1 }),
				lastRequestNumber: this.lastRequestNumber,
			};
		}
	}

	reset(): void {
		this.lastRequestNumber = -1;
		this.synchronization.setCellValue({ cell: 0, value: 0 });
		this.synchronization.setCellValue({ cell: 1, value: 0 });
	}
}
