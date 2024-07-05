import {
	ISharedMemoryBuilder,
	MemoryView,
	SharedMemoryBuilder,
	getMemoryViewParameters,
	parseAsMemoryView,
} from "../ThreadSharedMemory";

console.log("** Test Thread Shared Memory **");

export const constructNewMemoryView = async () => {
	console.log("** (1) Construct New Memory View **");
	const memoryBuilder: ISharedMemoryBuilder = new SharedMemoryBuilder();

	try {
		const tooSmall: MemoryView = memoryBuilder
			.maxMemoryCellValue(0)
			.neededCellAmount(1)
			.build();
	} catch (error) {
		console.error(
			"[constructNewMemoryView] maxMemoryCellValue(0) Error : ",
			(error as Error).message
		);
	}

	const uint8ArrayTwoCells: MemoryView = memoryBuilder
		.maxMemoryCellValue(220)
		.neededCellAmount(2)
		.build();
	console.log(
		"[constructNewMemoryView] uint8ArrayTwoCells : ",
		uint8ArrayTwoCells
	);
	console.log(
		"[checkIfMemoryView] getMemoryViewParameters uint8ArrayTwoCells : ",
		getMemoryViewParameters(uint8ArrayTwoCells)
	);

	const uint16ArrayOneCell: MemoryView = memoryBuilder
		.maxMemoryCellValue(300)
		.neededCellAmount(1)
		.build();
	console.log(
		"[constructNewMemoryView] uint16ArrayOneCell : ",
		uint16ArrayOneCell
	);
	console.log(
		"[checkIfMemoryView] getMemoryViewParameters uint16ArrayOneCell : ",
		getMemoryViewParameters(uint16ArrayOneCell)
	);

	const uint32ArrayOneCell: MemoryView = memoryBuilder
		.maxMemoryCellValue(65536)
		.neededCellAmount(3)
		.build();
	console.log(
		"[constructNewMemoryView] uint32ArrayOneCell : ",
		uint32ArrayOneCell
	);
	console.log(
		"[checkIfMemoryView] getMemoryViewParameters uint32ArrayOneCell : ",
		getMemoryViewParameters(uint32ArrayOneCell)
	);

	try {
		const tooBig: MemoryView = memoryBuilder
			.maxMemoryCellValue(4294967297)
			.neededCellAmount(1)
			.build();
	} catch (error) {
		console.error(
			"[constructNewMemoryView] maxMemoryCellValue(4294967297) Error : ",
			(error as Error).message
		);
	}
};

export const checkIfMemoryView = async () => {
	console.log("** (2) Check If Memory View **");

	const memoryBuilder: ISharedMemoryBuilder = new SharedMemoryBuilder();
	const uint8ArrayTwoCells: MemoryView = memoryBuilder
		.maxMemoryCellValue(220)
		.neededCellAmount(2)
		.build();
	console.log("[checkIfMemoryView] uint8ArrayTwoCells : ", uint8ArrayTwoCells);

	try {
		const errored = parseAsMemoryView("nope" as unknown);
	} catch (error) {
		console.error(
			'[checkIfMemoryView] parseAsMemoryView("nope" as unknown) Error : ',
			(error as Error).message
		);
	}

	const memoryView = parseAsMemoryView(uint8ArrayTwoCells as unknown);
	console.log("[checkIfMemoryView] parseAsMemoryView result : ", memoryView);
};
