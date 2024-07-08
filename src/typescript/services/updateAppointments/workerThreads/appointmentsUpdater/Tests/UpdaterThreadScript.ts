import path from "path";
import { buildPostOfficePerMinuteLimitTracker } from "../../../helpers/consumptionTracker/RequestTracker";
import { WorkerWrapper } from "../../../helpers/threadCommunication/CommunicationWrappers";
import {
	ThreadMessage,
	AppointmentsUpdatingMessages,
} from "../../../helpers/threadCommunication/Messages";

console.log("** Test Updater Thread Script **");

export const testSingleUpdaterThread = async () => {
	console.log(
		"** (1) Test Updater Thread Script | Test Single Updater Thread **"
	);
	/**
	 * This will pretend to be an "Ip Menager",
	 * and will launc a sinlge web_worker thaqt pointw to updater thread script.
	 */

	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 48,
	});

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, "..", "UpdaterThreadScript.js"),
		workerData: { memoryView },
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log("[testSingleUpdaterThread] Incoming Message : ", message);
			communicationWrapper.sendMessage(AppointmentsUpdatingMessages.EndUpdater);
			communicationWrapper.terminate();
		},

		onErrorCallback(error) {
			console.log("[testSingleUpdaterThread] Error : ", error.message);
			communicationWrapper.terminate();
		},

		onExitCallback(exitCode) {
			console.log("[testSingleUpdaterThread] Exit Code : ", exitCode);
			communicationWrapper.terminate();
		},
	});

	const message: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	communicationWrapper.sendMessage(message);
};

export const testMultipleUpdaterThread = async () => {
	console.log(
		"** (1) Test Updater Thread Script | Test Multiple Updater Thread **"
	);
	/**
	 * This will pretend to be an "Ip Menager",
	 * and will launc a sinlge web_worker thaqt pointw to updater thread script.
	 */

	const { memoryView, requestTracker } = buildPostOfficePerMinuteLimitTracker({
		maximumPerMinute: 48,
	});

	for (let i = 0; i < 8; i++) {
		// Create a dummy worker for testing.
		const communicationWrapper = new WorkerWrapper({
			workerScript: path.join(__dirname, "..", "UpdaterThreadScript.js"),
			workerData: { memoryView },
		});

		communicationWrapper.setCallbacks({
			onMessageCallback(message) {
				console.log("[testMultipleUpdaterThread] Incoming Message : ", message);
				communicationWrapper.sendMessage(
					AppointmentsUpdatingMessages.EndUpdater
				);
				communicationWrapper.terminate();
			},

			onErrorCallback(error) {
				console.log("[testMultipleUpdaterThread] Error : ", error.message);
				communicationWrapper.terminate();
			},

			onExitCallback(exitCode) {
				console.log("[testMultipleUpdaterThread] Exit Code : ", exitCode);
				communicationWrapper.terminate();
			},
		});

		const message: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
		communicationWrapper.sendMessage(message);
	}
};
