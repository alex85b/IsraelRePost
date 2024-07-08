import { parentPort, workerData, threadId } from "worker_threads";

import { getMemoryViewParameters } from "../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { PostofficeBranchesRepository } from "../../../../data/repositories/PostofficeBranchesRepository";
import { PostofficeCodeIdPairsRepository } from "../../../../data/repositories/PostofficeCodeIdPairsRepository";
import { UpdateErrorRecordsRepository } from "../../../../data/repositories/UpdateErrorRecordsRepository";
import { ConstructLogMessage } from "../../../../shared/classes/ConstructLogMessage";
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

const logMessage = new ConstructLogMessage([`UpdaterThreadScript ${threadId}`]);

if (!parentPort)
	throw Error(logMessage.createLogMessage({ subject: "Invalid parentPort" }));
if (!workerData)
	throw Error(
		logMessage.createLogMessage({ subject: "Invalid workerData - Undefined" })
	);
if (typeof workerData !== "object")
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - Not an object",
		})
	);
if (!workerData.memoryView)
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - No memoryView",
		})
	);
if (!workerData.parentId)
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - No parentId",
		})
	);

logMessage.addLogHeader(`Parent ID ${workerData.parentId}`);

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

logMessage.addLogHeader("Messages Callback");
communicationWrapper.setCallbacks({
	async onMessageCallback(message) {
		console.log(
			logMessage.createLogMessage({ subject: "Incoming Message", message })
		);
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
				throw Error(
					logMessage.createLogMessage({ subject: "Unsupported message" })
				);
		}
	},
});
