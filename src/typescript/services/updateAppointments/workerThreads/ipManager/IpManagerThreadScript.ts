import path from "path";
import { threadId, parentPort, workerData } from "worker_threads";
import {
	MemoryView,
	SharedMemoryBuilder,
	getMemoryViewParameters,
} from "../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { ConstructLogMessage } from "../../../../shared/classes/ConstructLogMessage";
import { AtomicArrayWriter } from "../../helpers/concurrency/AtomicArrayWriter";
import { buildMutexRequestsBatchTracker } from "../../helpers/consumptionTracker/RequestsBatchTracker";
import { RequestTracker } from "../../helpers/consumptionTracker/RequestTracker";
import { ParentPortWrapper } from "../../helpers/threadCommunication/CommunicationWrappers";
import { IpManagerContinuesMessages } from "../../helpers/threadCommunication/Messages";
import {
	IEndpointStarter,
	HandleStartEndpoint,
	HandleUpdaterDepleted,
	HandleUpdaterDone,
	IEndpointEnder,
	HandleEndEndpoint,
} from "./MessageHandler";

const logMessage = new ConstructLogMessage([
	`IpManagerThreadScript ${threadId}`,
]);

if (!parentPort)
	throw Error(logMessage.createLogMessage({ subject: "Invalid parentPort" }));
if (!workerData)
	throw Error(
		logMessage.createLogMessage({ subject: "Invalid workerData - Undefined" })
	);
console.log(
	logMessage.createLogMessage({
		subject: "workerData",
		message: JSON.stringify(workerData, null, 4),
	})
);
if (typeof workerData !== "object")
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - Not an object",
		})
	);
if (!workerData.proxyEndpoint)
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - No proxyEndpoint",
		})
	);

const parentCommunication = new ParentPortWrapper({ parentPort });
const sharedMemory: MemoryView = new SharedMemoryBuilder()
	.maxMemoryCellValue(50)
	.neededCellAmount(2)
	.build();

sharedMemory[0] = threadId;

// Israel Post Limits Requests per-minute, and per-hour.
const requestsPerHourLimit = 285; // 300 is the actual maximum.
const requestsPerMinuteLimit = 48; // 50 is the actual maximum.

const batchTracker = buildMutexRequestsBatchTracker(requestsPerHourLimit);
const sharedTracking = new RequestTracker({
	atomicArrayWriter: new AtomicArrayWriter({
		memoryView: sharedMemory,
		viewParametersExtractor: getMemoryViewParameters,
	}),
	authorizationLimit: requestsPerMinuteLimit,
});

const endpointStarter: IEndpointStarter = {
	batchTracker,
	sharedMemory,
	parentCommunication,
	requestsPerMinuteLimit,
	threadId,
	updaterScriptPath: path.join(
		__dirname,
		"..",
		"appointmentsUpdater",
		"UpdaterThreadScript.js"
	),
	proxyEndpoint: workerData.proxyEndpoint,
};

const handleStartEndpoint = new HandleStartEndpoint(endpointStarter);

const endpointEnder: IEndpointEnder = {
	RuningEndpoint: handleStartEndpoint,
	threadId: threadId,
};

handleStartEndpoint.configure({
	"updater-depleted": new HandleUpdaterDepleted({
		batchTracker,
		parentCommunication,
		requestsPerMinuteLimit,
		sharedTracking,
		threadId,
	}),
	"updater-done": new HandleUpdaterDone({
		workers: handleStartEndpoint,
		threadId,
	}),
});

const handleEndEndpoint = new HandleEndEndpoint(endpointEnder);

parentCommunication.setCallbacks({
	onMessageCallback(message) {
		console.log(
			logMessage.createLogMessage({
				subject: "Incoming Message",
				message,
			})
		);

		switch (message) {
			case IpManagerContinuesMessages.StartEndpoint:
				handleStartEndpoint.handle();
				break;
			case IpManagerContinuesMessages.EndEndpoint:
				handleEndEndpoint.handle();
				break;
			default:
				throw Error(
					logMessage.createLogMessage({
						subject: "Unsupported Message",
						message,
					})
				);
		}
	},
});
