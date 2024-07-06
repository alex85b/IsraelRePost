import { AtomicArrayWriter, IAtomicArrayWriter } from "../AtomicArrayWriter";
import {
	MemoryView,
	SharedMemoryBuilder,
	getMemoryViewParameters,
} from "../../../../../data/models/dataTransferModels/ThreadSharedMemory";

console.log("** Test Atomic Array Writer **");

export const testSetCellValue = async () => {
	console.log("** (1) Test Set Cell Value **");
	const aWriter: IAtomicArrayWriter = new AtomicArrayWriter({
		memoryView: new SharedMemoryBuilder()
			.maxMemoryCellValue(350)
			.neededCellAmount(2)
			.build(),
		viewParametersExtractor: getMemoryViewParameters,
	});
	console.log(
		"[testSetCellValue] SharedMemoryBuilder().maxMemoryCellValue(350).neededCellAmount(2).build()"
	);

	console.log(
		"[testSetCellValue] setCellValue({ cell: 0, value: 100 } : ",
		aWriter.setCellValue({ cell: 0, value: 100 })
	);

	try {
		const badCell = aWriter.setCellValue({ cell: 2, value: 100 });
	} catch (error) {
		console.log(
			"[testSetCellValue] setCellValue({ cell: 2, value: 100 }) : ",
			(error as Error).message
		);
	}

	try {
		const badValue = aWriter.setCellValue({ cell: 1, value: -1 });
	} catch (error) {
		console.log(
			"[testSetCellValue] setCellValue({ cell: 1, value: -1 }) : ",
			(error as Error).message
		);
	}

	try {
		const badValue = aWriter.setCellValue({ cell: 0, value: 65536 });
	} catch (error) {
		console.log(
			"[testSetCellValue] setCellValue({ cell: 0, value: 65535 }) : ",
			(error as Error).message
		);
	}
};

export const testReplaceExpectedValue = async () => {
	console.log("** (2) Test Replace Expected Value **");
	const aWriter: IAtomicArrayWriter = new AtomicArrayWriter({
		memoryView: new SharedMemoryBuilder()
			.maxMemoryCellValue(100)
			.neededCellAmount(3)
			.build(),
		viewParametersExtractor: getMemoryViewParameters,
	});

	console.log(
		"[testSetCellValue] SharedMemoryBuilder().maxMemoryCellValue(100).neededCellAmount(3).build()"
	);

	console.log(
		"[testReplaceExpectedValue] replaceExpectedValue({ cell: 0, expected: 0, replaceWith: 100 }) : ",
		aWriter.replaceExpectedValue({ cell: 0, expected: 0, replaceWith: 100 })
	);

	console.log(
		"[testReplaceExpectedValue] replaceExpectedValue({ cell: 0, expected: 1, replaceWith: 2 }) : ",
		aWriter.replaceExpectedValue({ cell: 0, expected: 1, replaceWith: 2 })
	);
};

export const testAddToCellValue = async () => {
	console.log("** (2) Test Add To Cell Value **");
	const aWriter: IAtomicArrayWriter = new AtomicArrayWriter({
		memoryView: new SharedMemoryBuilder()
			.maxMemoryCellValue(100)
			.neededCellAmount(1)
			.build(),
		viewParametersExtractor: getMemoryViewParameters,
	});

	console.log(
		"[testSetCellValue] SharedMemoryBuilder().maxMemoryCellValue(100).neededCellAmount(1).build()"
	);

	console.log(
		"[testReplaceExpectedValue] addToCellValue({ cell: 0, value: 200 }) : ",
		aWriter.addToCellValue({ cell: 0, value: 200 })
	);

	console.log(
		"[testReplaceExpectedValue] peakCellValue({ cell: 0}) : ",
		aWriter.peakCellValue({ cell: 0 })
	);

	console.log(
		"[testReplaceExpectedValue] addToCellValue({ cell: 0, value: 100 }) : ",
		aWriter.addToCellValue({ cell: 0, value: 100 })
	);

	console.log(
		"[testReplaceExpectedValue] peakCellValue({ cell: 0}) : ",
		aWriter.peakCellValue({ cell: 0 })
	);
};
