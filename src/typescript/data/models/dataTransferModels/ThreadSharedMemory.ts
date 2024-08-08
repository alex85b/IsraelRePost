import { ServiceError, ErrorSource } from "../../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../../shared/classes/WinstonClient";
import { isValidNumber } from "../shared/FieldValidation";

export type MemoryView = Uint8Array | Uint16Array | Uint32Array;

export interface ISharedMemoryBuilder {
	maxMemoryCellValue(maxCellValue: number): this;
	neededCellAmount(cellAmount: number): this;
	build(): MemoryView;
}

export class SharedMemoryBuilder implements ISharedMemoryBuilder {
	private faults: string[];
	private cellAmount: number | undefined;
	private bytesPerCell: number | undefined;
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor() {
		this.faults = [];

		this.cellAmount = undefined;
		this.bytesPerCell = undefined;

		this.pathStack = new PathStack().push("Shared Memory Builder");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	maxMemoryCellValue(maxCellValue: number) {
		if (!isValidNumber(maxCellValue)) {
			this.faults.push("maxCellValue is not a number");
			return this;
		}

		if (maxCellValue < 1) {
			this.faults.push(`maxCellValue ${maxCellValue} is below 1`);
			this.bytesPerCell = 0;
		} else if (maxCellValue <= 255) {
			/* 255 <--> (2^(8*b) - 1) | -1 to include '0'
            b = 1*/
			this.bytesPerCell = 1; // :b
		} else if (maxCellValue <= 65535) {
			/* 65535 <--> (2^(8*b) - 1) | -1 to include '0'
            b = 2*/
			this.bytesPerCell = 2; // :b
		} else if (maxCellValue <= 4294967295) {
			/* 4294967295 <--> (2^(8*b) - 1) | -1 to include '0'
            b = 3*/
			this.bytesPerCell = 4; // :b
		} else {
			this.faults.push(`maxCellValue ${maxCellValue} is above 4294967295`);
			this.bytesPerCell = 0;
		}
		return this;
	}

	neededCellAmount(cellAmount: number) {
		if (!isValidNumber(cellAmount)) {
			this.faults.push("cellAmount is not a number");
		} else this.cellAmount = cellAmount;
		return this;
	}

	build() {
		try {
			if (typeof this.bytesPerCell === "undefined")
				this.faults.push("maxMemoryCellValue has to be used");
			if (typeof this.cellAmount === "undefined")
				this.faults.push("neededCellAmount has to be used");
			if (this.faults.length)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Internal,
					message: "Thread Shared Memory Build Failed",
					details: {
						faults: this.faults.join(" | "),
					},
				});

			const sharedBuffer = new SharedArrayBuffer(
				(this.bytesPerCell ?? 0) * (this.cellAmount ?? 0)
			);
			if (this.bytesPerCell === 1) return new Uint8Array(sharedBuffer);
			if (this.bytesPerCell === 2) return new Uint16Array(sharedBuffer);
			return new Uint32Array(sharedBuffer);
		} finally {
			this.faults = [];
			this.bytesPerCell = undefined;
			this.cellAmount = undefined;
		}
	}
}

export interface IParseAsMemoryView {
	(input: any): MemoryView;
}

export const parseAsMemoryView: IParseAsMemoryView = (
	input: any
): MemoryView => {
	const logger = new WinstonClient({
		pathStack: new PathStack().push("Parse As Memory View"),
	});
	if (input instanceof Uint8Array) return input as Uint8Array;
	if (input instanceof Uint16Array) return input as Uint16Array;
	if (input instanceof Uint32Array) return input as Uint32Array;
	throw new ServiceError({
		logger,
		source: ErrorSource.Internal,
		message: "Input is not a MemoryView, cannot perform parsing",
		details: {
			input,
		},
	});
};

export interface IGetMemoryViewParameters {
	(memoryView: MemoryView): {
		cellCount: number;
		maxCellValue: number;
		minCellValue: number;
	};
}

export const getMemoryViewParameters: IGetMemoryViewParameters = (
	memoryView: MemoryView
) => {
	const bytesPerCell = memoryView?.BYTES_PER_ELEMENT ?? 0;
	const maxCellValue = Math.pow(2, bytesPerCell * 8) - 1;
	const cellCount = memoryView?.length ?? 0;

	return {
		cellCount,
		maxCellValue,
		minCellValue: 0,
	};
};
