import { parentPort, workerData, threadId } from "worker_threads";
import { getMemoryViewParameters } from "../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { PostofficeBranchesRepository } from "../../../../data/repositories/PostofficeBranchesRepository";
import { PostofficeCodeIdPairsRepository } from "../../../../data/repositories/PostofficeCodeIdPairsRepository";
import { UpdateErrorRecordsRepository } from "../../../../data/repositories/UpdateErrorRecordsRepository";
import { AtomicArrayWriter } from "../../helpers/concurrency/AtomicArrayWriter";
import { RequestTracker } from "../../helpers/consumptionTracker/RequestTracker";
import { ParentPortWrapper } from "../../helpers/threadCommunication/CommunicationWrappers";
import { HandlerClass } from "../../helpers/threadCommunication/Handler";
import { AppointmentsUpdatingMessages } from "../../helpers/threadCommunication/Messages";
import { ConstructServicesRecord } from "../../helpers/updateServicesRecord/ConstructServicesRecord";
import { IStoppable } from "../shared/stoppable";
import {
	IUpdateStarter,
	HandleStartUpdates,
	HandleContinueUpdates,
	HandleStopUpdates,
	HandleEndUpdater,
} from "./MessageHandlers";
import { PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";

const MODULE_NAME = "Updater Thread script";
const pathStack: PathStack = new PathStack().push(MODULE_NAME);
const logger: ILogger = new WinstonClient({ pathStack });

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
if (!workerData.memoryView)
	throw new ServiceError({
		message: "Invalid workerData: No memoryView",
		source: ErrorSource.Internal,
		logger: logger,
		threadId,
	});
if (!workerData.parentId)
	throw new ServiceError({
		message: "Invalid workerData: No parentId",
		source: ErrorSource.Internal,
		logger: logger,
		threadId,
	});

pathStack
	.push(`Parent ID ${workerData.parentId}`)
	.push(`Thread ID ${threadId}`);

const requestTracker = new RequestTracker({
	atomicArrayWriter: new AtomicArrayWriter({
		memoryView: workerData.memoryView,
		viewParametersExtractor: getMemoryViewParameters,
	}),
});

const communicationWrapper = new ParentPortWrapper({
	parentPort: parentPort,
});

const branchesRepository = new PostofficeBranchesRepository();
const errorRecordsRepository = new UpdateErrorRecordsRepository();

const updateStarter: IUpdateStarter = {
	branchesRepository,
	errorRecordsRepository: new UpdateErrorRecordsRepository(),
	codeIdPairRepo: new PostofficeCodeIdPairsRepository(),
	constructServices: new ConstructServicesRecord({
		branchesRepository,
		errorRepository: errorRecordsRepository,
		requestTracker,
	}),
	parentCommunication: communicationWrapper,
	endpointProxyString: workerData.proxyEndpoint,
	threadId,
	parentId: workerData.parentId,
	pathStack,
};

const startUpdates: HandlerClass<
	IUpdateStarter,
	AppointmentsUpdatingMessages.StartUpdates
> &
	IStoppable = new HandleStartUpdates(updateStarter);
const continueUpdater = new HandleContinueUpdates({
	...updateStarter,
	resetTracking: requestTracker,
});

const stopUpdates = new HandleStopUpdates({
	ongoingUpdaters: [startUpdates, continueUpdater],
});

const endUpdater = new HandleEndUpdater({
	ongoingUpdaters: [startUpdates, continueUpdater],
	processTerminator: process.exit,
});

communicationWrapper.setCallbacks({
	async onMessageCallback(message) {
		logger.logInfo({ message: "Incoming Message", details: message });
		switch (message) {
			case AppointmentsUpdatingMessages.ContinueUpdates:
				continueUpdater.handle();
				break;
			case AppointmentsUpdatingMessages.StopUpdates:
				stopUpdates.handle();
				break;
			case AppointmentsUpdatingMessages.StartUpdates:
				await startUpdates.handle();
				break;
			case AppointmentsUpdatingMessages.EndUpdater:
				endUpdater.handle();
				break;
			default:
				throw new ServiceError({
					message: "Unsupported message",
					source: ErrorSource.Internal,
					logger,
					details: { message },
				});
		}
	},
});
