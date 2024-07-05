import { WorkerWrapper } from "../CommunicationWrappers";
import path from "path";
import { ThreadMessage, AppointmentsUpdatingMessages } from "../Messages";

console.log("** Test Communication Wrappers **");

export const testWorkerWrapper = async () => {
	console.log("** (1) Test Worker Wrapper **");

	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, "WorkerDummyStub.js"),
		workerData: "This is workerData",
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log("[testWorkerWrapper] Incoming Message : ", message);
			communicationWrapper.terminate();
		},
		onErrorCallback(error) {
			console.log(
				"[testWorkerWrapper] Error : ",
				JSON.stringify(error, null, 4)
			);
		},
		onExitCallback(exitCode) {
			console.log("[testWorkerWrapper] Exit Code : ", exitCode);
		},
	});

	const message: ThreadMessage = AppointmentsUpdatingMessages.StartUpdates;
	communicationWrapper.sendMessage(message);
};
