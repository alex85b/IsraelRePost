import path from "path";
import { RequestTracker } from "../../../helpers/consumptionTracker/RequestTracker";
import { buildMutexRequestsBatchTracker } from "../../../helpers/consumptionTracker/RequestsBatchTracker";
import { ParentPortWrapper } from "../../../helpers/threadCommunication/CommunicationWrappers";
import { IpManagerContinuesMessages } from "../../../helpers/threadCommunication/Messages";
import {
	HandleEndEndpoint,
	HandleStartEndpoint,
	HandleUpdaterDepleted,
	HandleUpdaterDone,
	IEndpointEnder,
	IEndpointStarter,
} from "../MessageHandler";
import { ConstructLogMessage } from "../../../../../shared/classes/ConstructLogMessage";
import { parentPort, workerData, threadId } from "worker_threads";
import {
	MemoryView,
	SharedMemoryBuilder,
	getMemoryViewParameters,
} from "../../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { AtomicArrayWriter } from "../../../helpers/concurrency/AtomicArrayWriter";
import { PathStack } from "../../../../../shared/classes/PathStack";

const logMessage = new ConstructLogMessage([`IpManagerDummyStub ${threadId}`]);

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
const batchTracker = buildMutexRequestsBatchTracker(33);
const requestsPerMinuteLimit = 16;
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
	requestsPerMinuteLimit: 16,
	threadId,
	updaterScriptPath: path.join(__dirname, "AppointmentsUpdateDummyStub.js"),
	proxyEndpoint: workerData.proxyEndpoint,
	pathStack: new PathStack(),
};

const handleStartEndpoint = new HandleStartEndpoint(endpointStarter);

const endpointEnder: IEndpointEnder = {
	RuningEndpoint: handleStartEndpoint,
	threadId: threadId,
	pathStack: new PathStack(),
};

handleStartEndpoint.configure({
	"updater-depleted": new HandleUpdaterDepleted({
		batchTracker,
		parentCommunication,
		requestsPerMinuteLimit,
		sharedTracking,
		threadId,
		pathStack: new PathStack(),
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
				subject: "parentCommunication.setCallbacks",
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
