import { parentPort, workerData } from "worker_threads";
import { ParentPortWrapper } from "../CommunicationWrappers";
import { ThreadMessage, ContinuesUpdateMessages } from "../Messages";

if (!parentPort) throw Error("[WorkerDummyStub] Invalid parentPort");
if (!workerData) throw Error("[WorkerDummyStub] Invalid workerData");
console.log("[WorkerDummyStub] workerData : ", JSON.stringify(workerData));
const outgoingMessage: ThreadMessage = ContinuesUpdateMessages.ManagerDone;
const communicationWrapper = new ParentPortWrapper({
	parentPort: parentPort,
});

communicationWrapper.setCallbacks({
	onMessageCallback(message) {
		console.log("[WorkerDummyStub] Incoming Message : ", message);
		communicationWrapper.sendMessage(outgoingMessage);
	},
});
