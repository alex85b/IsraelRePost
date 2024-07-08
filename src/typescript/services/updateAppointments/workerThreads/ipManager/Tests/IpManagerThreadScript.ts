import path from "path";
import { WorkerWrapper } from "../../../helpers/threadCommunication/CommunicationWrappers";
import {
	AppointmentsUpdatingMessages,
	IpManagerContinuesMessages,
	ThreadMessage,
} from "../../../helpers/threadCommunication/Messages";
import { buildUsingProxyFile } from "../../../../../data/models/dataTransferModels/ProxyEndpointString";

console.log("** Test Ip Manager Thread Script **");

export const testSingleIpManagerThread = async () => {
	console.log(
		"** (1) Test Ip Manager Thread Script | Test Single Ip Manager Thread **"
	);
	/**
	 * This will pretend to be an "Continues Update Class",
	 * and will launc a sinlge web_worker that points to ip-manager thread script.
	 */

	// Create a dummy worker for testing.
	const communicationWrapper = new WorkerWrapper({
		workerScript: path.join(__dirname, "..", "IpManagerThreadScript.js"),
		workerData: { proxyEndpoint: await getProxyEndpoint(0) },
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

	const message: ThreadMessage = IpManagerContinuesMessages.StartEndpoint;
	communicationWrapper.sendMessage(message);
};

export const testMultipleIpManagerThreads = async () => {
	console.log(
		"** (1) Test Ip Manager Thread Script | Test Multiple Ip Manager Threads **"
	);
	/**
	 * This will pretend to be an "Continues Update Class",
	 * and will launc a sinlge web_worker that points to ip-manager thread script.
	 */
	for (let i = 0; i < 2; i++) {
		// Create a dummy worker for testing.
		const communicationWrapper = new WorkerWrapper({
			workerScript: path.join(__dirname, "..", "IpManagerThreadScript.js"),
			workerData: { proxyEndpoint: await getProxyEndpoint(i) },
		});

		communicationWrapper.setCallbacks({
			onMessageCallback(message) {
				console.log("[testSingleUpdaterThread] Incoming Message : ", message);
				communicationWrapper.sendMessage(
					AppointmentsUpdatingMessages.EndUpdater
				);
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

		const message: ThreadMessage = IpManagerContinuesMessages.StartEndpoint;
		communicationWrapper.sendMessage(message);
	}
};

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

const getProxyEndpoint = async (at: number): Promise<string> => {
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

	return proxyEndpoints[at];
};
