// Request Tracker

import {
	MemoryView,
	SharedMemoryBuilder,
	getMemoryViewParameters,
} from '../../../../data/models/dataTransferModels/ThreadSharedMemory';
import { AtomicArrayWriter, IAtomicArrayWriter } from '../concurrency/AtomicArrayWriter';

export type RequestTrackerReason = 'OK' | 'overflow' | 'above limit';

export type RequestTrackerResponse = {
	authorized: boolean;
	beforeAddition: number;
	expectedAfterAddition: number;
	lastRequestNumber: number;
	authorizationLimit: number;
	reason: RequestTrackerReason;
};

export interface IRequestTracker {
	trackRequest(): RequestTrackerResponse;
}

export interface IResetSharedTracking {
	resetTracking(data: { sharedLimit: number; resetLocalMemory?: boolean }): boolean;
}

export interface IReseLocalTracking {
	resetLocally(): void;
}

export interface IObserveSharedTracking {
	observeTracking(): number;
	observeLimit(): number;
}

export class RequestTracker
	implements IRequestTracker, IResetSharedTracking, IReseLocalTracking, IObserveSharedTracking
{
	private atomicArrayWriter: IAtomicArrayWriter;
	private lastRequestNumber: number;
	private memoryMaxCellValue: number;

	constructor(buildData: { atomicArrayWriter: IAtomicArrayWriter; authorizationLimit?: number }) {
		const faults: string[] = [];
		const { memoryCellCount, memoryMaxCellValue, memoryMinCellValue } =
			buildData.atomicArrayWriter.getMemoryArrayData();

		if (memoryCellCount < 2) faults.push("IAtomicArrayWriter's memoryCellCount is below 2");
		if (memoryMaxCellValue < 250)
			faults.push("IAtomicArrayWriter's memoryMaxCellValue is below 255");
		if (faults.length)
			throw Error('[RequestTracker][constructor] Faults : ' + faults.join(' | '));

		this.atomicArrayWriter = buildData.atomicArrayWriter;
		if (buildData.authorizationLimit !== undefined) {
			this.resetTracking({
				sharedLimit: buildData.authorizationLimit,
				resetLocalMemory: true,
			});
		}
		this.lastRequestNumber = -1;
		this.memoryMaxCellValue = this.atomicArrayWriter.getMemoryArrayData().memoryMaxCellValue;
	}

	observeTracking(): number {
		return this.atomicArrayWriter.peakCellValue({ cell: 0 });
	}

	observeLimit(): number {
		return this.atomicArrayWriter.peakCellValue({ cell: 1 });
	}

	resetLocally(): void {
		this.lastRequestNumber = -1;
	}

	resetTracking(data: { sharedLimit: number; resetLocalMemory?: boolean }): boolean {
		if (data.resetLocalMemory) this.lastRequestNumber = -1;
		const valueSet = this.atomicArrayWriter.setCellValue({ cell: 0, value: 0 });
		const limitSet = this.atomicArrayWriter.setCellValue({ cell: 1, value: data.sharedLimit });
		return valueSet && limitSet;
	}

	trackRequest(): RequestTrackerResponse {
		const incrementResult = this.atomicArrayWriter.addToCellValue({ cell: 0, value: 1 });

		/*
		Current Increment-result (before addition) is smaller or equal to a last known Increment-result.
		Lock tracking for every tracker and return negative indication*/
		if (incrementResult.beforeAddition <= this.lastRequestNumber) {
			this.atomicArrayWriter.setCellValue({
				cell: 1, // This cell holds the authorization limit
				value: 0,
			});
			return {
				...incrementResult,
				lastRequestNumber: this.lastRequestNumber,
				authorized: false,
				authorizationLimit: this.atomicArrayWriter.peakCellValue({ cell: 1 }),
				reason: 'overflow',
			};
		}

		/*
		Current Increment-result (after addition) is smaller or equal than authorization limit.
		Remember current Response and return positive indication*/
		if (
			incrementResult.expectedAfterAddition <=
			this.atomicArrayWriter.peakCellValue({ cell: 1 })
		) {
			const returnThis: RequestTrackerResponse = {
				...incrementResult,
				lastRequestNumber: this.lastRequestNumber,
				authorized: true,
				authorizationLimit: this.atomicArrayWriter.peakCellValue({ cell: 1 }),
				reason: 'OK',
			};
			this.lastRequestNumber = incrementResult.beforeAddition;
			return returnThis;
		}

		/*
        Current Increment-result (after addition) is bigger than authorization limit.
		Check if Increment-result (before addition) was maximal possible value,
		If so then revoke authorization.
        return negative indication*/
		if (incrementResult.beforeAddition === this.memoryMaxCellValue) {
			this.atomicArrayWriter.setCellValue({
				cell: 1, // This cell holds the authorization limit
				value: 0,
			});
		}
		return {
			...incrementResult,
			lastRequestNumber: this.lastRequestNumber,
			authorized: false,
			authorizationLimit: this.atomicArrayWriter.peakCellValue({ cell: 1 }),
			reason: 'above limit',
		};
	}
}

export interface IBuildPostOfficePerMinuteLimitTracker {
	(args: { maximumPerMinute: number }): {
		requestTracker: IRequestTracker & IReseLocalTracking & IResetSharedTracking;
		memoryView: MemoryView;
	};
}

export const buildPostOfficePerMinuteLimitTracker: IBuildPostOfficePerMinuteLimitTracker = (args: {
	maximumPerMinute: number;
}) => {
	const memoryView: MemoryView = new SharedMemoryBuilder()
		.maxMemoryCellValue(250)
		.neededCellAmount(2)
		.build();
	const atomicArrayWriter: IAtomicArrayWriter = new AtomicArrayWriter({
		memoryView,
		viewParametersExtractor: getMemoryViewParameters,
	});
	atomicArrayWriter.setCellValue({ cell: 1, value: args.maximumPerMinute });
	const requestTracker = new RequestTracker({ atomicArrayWriter });
	return { requestTracker, memoryView };
};
