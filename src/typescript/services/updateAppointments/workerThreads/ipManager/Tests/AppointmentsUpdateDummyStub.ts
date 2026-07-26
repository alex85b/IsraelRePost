import { getMemoryViewParameters } from "../../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { PostofficeBranchesRepository } from "../../../../../data/repositories/PostofficeBranchesRepository";
import { PostofficeCodeIdPairsRepository } from "../../../../../data/repositories/PostofficeCodeIdPairsRepository";
import { UpdateErrorRecordsRepository } from "../../../../../data/repositories/UpdateErrorRecordsRepository";
import { AtomicArrayWriter } from "../../../helpers/concurrency/AtomicArrayWriter";
import { RequestTracker } from "../../../helpers/consumptionTracker/RequestTracker";
import { ParentPortWrapper } from "../../../helpers/threadCommunication/CommunicationWrappers";
import {
	AppointmentsUpdatingMessages,
	IpManagerUpdaterMessages,
} from "../../../helpers/threadCommunication/Messages";
import { ConstructServicesRecord } from "../../../helpers/updateServicesRecord/ConstructServicesRecord";
import { IUpdateStarter } from "../../appointmentsUpdater/MessageHandlers";
import { parentPort, workerData, threadId } from "worker_threads";
import { PathStack } from "../../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../../shared/classes/WinstonClient";
import { ServiceError, ErrorSource } from "../../../../../errors/ServiceError";

const MODULE_NAME = "Appointments update Dummy stub";
const pathStack: PathStack = new PathStack()
	.push(MODULE_NAME)
	.push(String(threadId));
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

/*
This is what needed for an update,
here to test WorkerData */
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

communicationWrapper.setCallbacks({
	async onMessageCallback(message) {
		logger.logInfo({ message: "Incoming Message", details: message });

		if (message === AppointmentsUpdatingMessages.StartUpdates) {
			let response;
			do {
				response = requestTracker.trackRequest();
				if (response.beforeAddition % 5 === 0) {
					await new Promise<void>((resolve) => {
						setTimeout(() => {
							resolve();
						}, 1500);
					});
				}
				logger.logInfo({
					message: "Post office API request",
					details: response,
				});
			} while (response && response.authorized);
			communicationWrapper.sendMessage(
				IpManagerUpdaterMessages.UpdaterDepleted
			);
		}

		if (message === AppointmentsUpdatingMessages.ContinueUpdates) {
			requestTracker.resetLocally();
			let response;
			do {
				response = requestTracker.trackRequest();
				logger.logInfo({
					message: "Post office API request",
					details: response,
				});
			} while (response && response.authorized);
			communicationWrapper.sendMessage(IpManagerUpdaterMessages.UpdaterDone);
		}

		if (message === AppointmentsUpdatingMessages.EndUpdater) {
			await new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 3000);
			});
			process.exit(0);
		}
	},
});
