import { parentPort, workerData, threadId } from "worker_threads";
import { ParentPortWrapper } from "../../../helpers/threadCommunication/CommunicationWrappers";
import { AppointmentsUpdatingMessages } from "../../../helpers/threadCommunication/Messages";
import {
	HandleContinueUpdates,
	HandleEndUpdater,
	HandleStartUpdates,
	HandleStopUpdates,
	IUpdateStarter,
} from "../MessageHandlers";
import { PostofficeBranchesRepository } from "../../../../../data/repositories/PostofficeBranchesRepository";
import { UpdateErrorRecordsRepository } from "../../../../../data/repositories/UpdateErrorRecordsRepository";
import { PostofficeCodeIdPairsRepository } from "../../../../../data/repositories/PostofficeCodeIdPairsRepository";
import { ConstructServicesRecord } from "../../../helpers/updateServicesRecord/ConstructServicesRecord";
import { RequestTracker } from "../../../helpers/consumptionTracker/RequestTracker";
import { getMemoryViewParameters } from "../../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { AtomicArrayWriter } from "../../../helpers/concurrency/AtomicArrayWriter";
import { HandlerClass } from "../../../helpers/threadCommunication/Handler";
import { IStoppable } from "../../shared/stoppable";
import { PathStack } from "../../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../../errors/ServiceError";

const MODULE_NAME = "Worker Dummy stub";
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
	parentId: 999,
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

communicationWrapper.setCallbacks({
	async onMessageCallback(message) {
		logger.logInfo({ message: "Incoming Message", details: message });
		switch (message) {
			case AppointmentsUpdatingMessages.ContinueUpdates:
				continueUpdater.handle();
				break;
			case AppointmentsUpdatingMessages.StopUpdates:
				const stopUpdates = new HandleStopUpdates({
					ongoingUpdaters: [startUpdates, continueUpdater],
				});
				stopUpdates.handle();
				break;
			case AppointmentsUpdatingMessages.StartUpdates:
				await startUpdates.handle();
				break;
			case AppointmentsUpdatingMessages.EndUpdater:
				const endUpdater = new HandleEndUpdater({
					ongoingUpdaters: [startUpdates, continueUpdater],
					processTerminator: process.exit,
				});
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
