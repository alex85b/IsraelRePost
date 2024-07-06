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
import { ConstructLogMessage } from "../../../../../shared/classes/ConstructLogMessage";
import { HandlerClass } from "../../../helpers/threadCommunication/Handler";
import { IStoppable } from "../../shared/stoppable";

const logMessage = new ConstructLogMessage([`WorkerDummyStub ${threadId}`]);

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
if (!workerData.memoryView)
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - No memoryView",
		})
	);

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

logMessage.addLogHeader("onMessageCallback");
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
				throw Error(
					logMessage.createLogMessage({ subject: "Unsupported message" })
				);
		}
	},
});
