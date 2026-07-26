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

import { PathStack } from "../../../../shared/classes/PathStack";
import { WinstonClient } from "../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";
import {
	IEndpointStarter,
	HandleStartEndpoint,
	IEndpointEnder,
	HandleUpdaterDepleted,
	HandleUpdaterDone,
	HandleEndEndpoint,
} from "./MessageHandler";

const logMessage = new ConstructLogMessage([
	`IpManagerThreadScript ${threadId}`,
]);

const MODULE_NAME = "Ip manager Thread script";
const pathStack = new PathStack().push(MODULE_NAME);
const logger = new WinstonClient({ pathStack });

if (!parentPort)
	throw new ServiceError({
		message: "Invalid parentPort",
		source: ErrorSource.Internal,
		logger: logger,
		threadId,
	});
if (!workerData)
	throw new ServiceError({
		message: "Invalid workerData: Undefined",
		source: ErrorSource.Internal,
		logger: logger,
		threadId,
	});
if (typeof workerData !== "object")
	throw new ServiceError({
		message: "Invalid workerData: Not an object",
		source: ErrorSource.Internal,
		logger: logger,
		threadId,
	});
if (!workerData.proxyEndpoint)
	throw new ServiceError({
		message: "Invalid workerData: No proxyEndpoint",
		source: ErrorSource.Internal,
		logger: logger,
		threadId,
	});

pathStack.push(`Thread ID ${threadId}`);

const parentCommunication = new ParentPortWrapper({ parentPort });
const sharedMemory: MemoryView = new SharedMemoryBuilder()
	.maxMemoryCellValue(50)
	.neededCellAmount(2)
	.build();

// sharedMemory[0] = 0;

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
	pathStack,
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
	pathStack,
};

handleStartEndpoint.configure({
	"updater-depleted": new HandleUpdaterDepleted({
		batchTracker,
		parentCommunication,
		requestsPerMinuteLimit,
		sharedTracking,
		threadId,
		pathStack,
	}),
	"updater-done": new HandleUpdaterDone({
		shutDownTarget: handleStartEndpoint,
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
