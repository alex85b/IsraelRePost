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
import { ConstructLogMessage } from "../../../../../shared/classes/ConstructLogMessage";
import { parentPort, workerData, threadId } from "worker_threads";

const logMessage = new ConstructLogMessage([
	`AppointmentsUpdateDummyStub ${threadId}`,
]);

if (!parentPort)
	throw Error(logMessage.createLogMessage({ subject: "Invalid parentPort" }));
if (!workerData)
	throw Error(
		logMessage.createLogMessage({ subject: "Invalid workerData - Undefined" })
	);
if (!workerData.memoryView)
	throw Error(
		logMessage.createLogMessage({
			subject: "Invalid workerData - No memoryView",
		})
	);

console.log(
	logMessage.createLogMessage({
		subject: "workerData",
		message: JSON.stringify(workerData, null, 4),
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
};

logMessage.addLogHeader("onMessageCallback");
communicationWrapper.setCallbacks({
	async onMessageCallback(message) {
		console.log(
			logMessage.createLogMessage({
				subject: "Incoming message",
				message: message,
			})
		);

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
				console.log(
					logMessage.createLogMessage({
						subject: "Post office API request",
						message: JSON.stringify(response, null, 4),
					})
				);
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
				console.log(
					logMessage.createLogMessage({
						subject: "Post office API request",
						message: JSON.stringify(response, null, 4),
					})
				);
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
