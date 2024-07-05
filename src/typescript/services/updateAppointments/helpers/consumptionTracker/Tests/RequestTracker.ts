import {
	getMemoryViewParameters,
	SharedMemoryBuilder,
} from "../../../../../data/models/dataTransferModels/ThreadSharedMemory";
import {
	buildPostOfficePerMinuteLimitTracker,
	RequestTracker,
} from "../RequestTracker";
import { AtomicArrayWriter } from "../../concurrency/AtomicArrayWriter";
import { WorkerWrapper } from "../../threadCommunication/CommunicationWrappers";
import path from "path";

console.log("** Test Request Tracker **");

export const testSingleThreadTracking = async () => {
	console.log("** (1) Test Single Thread Tracking **");

	const memView = new SharedMemoryBuilder()
		.neededCellAmount(2)
		.maxMemoryCellValue(200)
		.build();

	const atomWriter = new AtomicArrayWriter({
		memoryView: memView,
		viewParametersExtractor: getMemoryViewParameters,
	});

	const tracker = new RequestTracker({
		atomicArrayWriter: atomWriter,
		authorizationLimit: 3,
	});

	console.log(
		"[testSingleThreadTracking] Construction : neededCellAmount(2) maxMemoryCellValue(200)"
	);

	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);
	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);
	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);
	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);
	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);

	console.log(
		"[testSingleThreadTracking] setCellValue({ cell: 0, value: 255 }) : ",
		atomWriter.setCellValue({ cell: 0, value: 255 })
	);

	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);
	console.log(
		"[testSingleThreadTracking] trackRequest : ",
		tracker.trackRequest()
	);
};

export const testMultiThreadedTracking = async () => {
	console.log("** (2) Test Multi Threaded Tracking **");

	const memView = new SharedMemoryBuilder()
		.neededCellAmount(2)
		.maxMemoryCellValue(200)
		.build();
	console.log(
		"[testSingleThreadTracking] Construction : neededCellAmount(2) maxMemoryCellValue(200)"
	);

	const atomWriter = new AtomicArrayWriter({
		memoryView: memView,
		viewParametersExtractor: getMemoryViewParameters,
	});

	console.log(
		"[testMultiThreadedTracking] setCellValue({ cell: 0, value: 250 }) : ",
		atomWriter.setCellValue({ cell: 0, value: 250 })
	);

	console.log(
		"[testMultiThreadedTracking] setCellValue({ cell: 1, value: 255 }) : ",
		atomWriter.setCellValue({ cell: 1, value: 255 })
	);

	for (let i = 0; i < 10; i++) {
		const communicationWrapper = new WorkerWrapper({
			workerScript: path.join(__dirname, "WorkerDummyStub.js"),
			workerData: memView,
		});
		communicationWrapper.setCallbacks({
			onMessageCallback(message) {
				console.log(`[testMultiThreadedTracking] Incoming Message : `, message);
				communicationWrapper.terminate();
			},
			onErrorCallback(error) {
				console.log(
					"[testMultiThreadedTracking] Error : ",
					JSON.stringify(error, null, 4)
				);
			},
			onExitCallback(exitCode) {
				console.log("[testMultiThreadedTracking] Exit Code : ", exitCode);
			},
		});
	}
};

export const testLimitReset = () => {
	console.log("** (3) Test Limit Reset **");
	const { requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 2,
	});
	console.log(
		"[testLimitReset] trackRequest : ",
		requestTracker.trackRequest()
	);
	console.log(
		"[testLimitReset] trackRequest : ",
		requestTracker.trackRequest()
	);
	console.log(
		"[testLimitReset] trackRequest : ",
		requestTracker.trackRequest()
	);
	console.log(
		"[testLimitReset] resetTracking 10 : ",
		requestTracker.resetTracking({ sharedLimit: 10, resetLocalMemory: true })
	);
	console.log(
		"[testLimitReset] after-reset trackRequest : ",
		requestTracker.trackRequest()
	);
	console.log(
		"[testLimitReset] after-reset trackRequest : ",
		requestTracker.trackRequest()
	);
	console.log(
		"[testLimitReset] after-reset trackRequest : ",
		requestTracker.trackRequest()
	);
};
