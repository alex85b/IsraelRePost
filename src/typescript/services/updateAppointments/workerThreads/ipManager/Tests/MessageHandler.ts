import path from "path";
import { buildUsingProxyFile } from "../../../../../data/models/dataTransferModels/ProxyEndpointString";
import { WorkerWrapper } from "../../../helpers/threadCommunication/CommunicationWrappers";
import {
	ThreadMessage,
	IpManagerContinuesMessages,
} from "../../../helpers/threadCommunication/Messages";
console.log("** Test Message Handlers **");

export const testHandleStartEndpoint = async () => {
	console.log("** (1) Test Message Handlers | Test Handle Start Endpoint **");

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, "IpManagerDummyStub.js"),
		workerData: { proxyEndpoint: await getProxyEndpoint() },
	});

	communicationWrapper.setCallbacks({
		onMessageCallback(message) {
			console.log("[testHandleStartEndpoint] Incoming Message : ", message);
			communicationWrapper.terminate();
		},

		onErrorCallback(error) {
			console.log("[testHandleStartEndpoint] Error : ", error.message);
		},

		onExitCallback(exitCode) {
			console.log("[testHandleStartEndpoint] Exit Code : ", exitCode);
		},
	});

	const message: ThreadMessage = IpManagerContinuesMessages.StartEndpoint;
	communicationWrapper.sendMessage(message);
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

const getProxyEndpoint = async (): Promise<string> => {
	const envFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		".env"
	);
	console.log("[getProxyEndpoint] path to env : ", envFilepath);
	const proxyFilepath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"..",
		"WebShare.txt"
	);
	console.log("[getProxyEndpoint] path to proxy file path : ", proxyFilepath);

	const proxyEndpoints = await buildUsingProxyFile({
		envFilepath,
		proxyFilepath,
		envPasswordKey: "PROX_WBSHA_PAS",
		envUsernameKey: "PROX_WBSHA_USR",
	});

	console.log("[getProxyEndpoint] proxyEndpoint : ", proxyEndpoints[0]);
	return proxyEndpoints[0];
};
