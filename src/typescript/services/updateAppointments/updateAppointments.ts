import path from "path";

import { WorkerWrapper } from "./helpers/threadCommunication/CommunicationWrappers";
import { repopulateUnprocessedBranchesQueue } from "../../services/updateAppointments/helpers/queueSetup/PopulateRedisQueue";
import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from "../../data/repositories/PostofficeBranchesRepository";
import {
	IPostofficeCodeIdPairsRepository,
	PostofficeCodeIdPairsRepository,
} from "../../data/repositories/PostofficeCodeIdPairsRepository";
import {
	ConstructLogMessage,
	ILogMessageConstructor,
} from "../../shared/classes/ConstructLogMessage";
import {
	buildUsingProxyFile,
	IEndpointsFileToArray,
} from "../../data/models/dataTransferModels/ProxyEndpointString";
import {} from "../updateAppointments/workerThreads/ipManager/IpManagerThreadScript";
import { ContinuesUpdateMessages } from "./helpers/threadCommunication/Messages";
import { IpManagerContinuesMessages } from "./helpers/threadCommunication/Messages";
import { IPathTracker, PathStack } from "../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../shared/classes/WinstonClient";

/**
 * Represents the first level of depth in the continuous update tree.
 * Communicates directly with the second level: 'Ip Managers' Worker threads.
 */
export class UpdateAppointmentsRoot {
	private IpManagers: { [key: number]: WorkerWrapper | null } = {};
	private branchesRepository: IPostofficeBranchesRepository;
	private idCodePairRepository: IPostofficeCodeIdPairsRepository;
	// private messageConstructor: ILogMessageConstructor;
	private proxyEndpointsBuilder: IEndpointsFileToArray;

	private proxyFilePath: string;
	private envFilePath: string;
	private ipManagerScriptPath: string;
	private logger: ILogger;
	private pathStack: IPathTracker;

	/**
	 * Constructor to initialize the ContinuesUpdate instance.
	 * @param useProxy - A boolean indicating whether to use a proxy.
	 */
	constructor(args: {
		useProxy: boolean;
		branchesRepository?: IPostofficeBranchesRepository;
		idCodePairRepository?: IPostofficeCodeIdPairsRepository;
		messageConstructor?: ILogMessageConstructor;
		proxyEndpointsBuilder?: IEndpointsFileToArray;
	}) {
		this.pathStack = new PathStack().push("Update Appointments root");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
		this.branchesRepository =
			args.branchesRepository ?? new PostofficeBranchesRepository();
		this.idCodePairRepository =
			args.idCodePairRepository ?? new PostofficeCodeIdPairsRepository();
		// this.messageConstructor = new ConstructLogMessage([
		// 	"Update Appointments Root",
		// ]);
		this.proxyEndpointsBuilder = buildUsingProxyFile;
		this.proxyFilePath = path.join(
			__dirname,
			"..",
			"..",
			"..",
			"..",
			"SmartProxy.txt"
		);
		this.envFilePath = path.join(__dirname, "..", "..", "..", "..", ".env");

		this.ipManagerScriptPath = path.join(
			__dirname,
			"..",
			"updateAppointments",
			"workerThreads",
			"ipManager",
			"IpManagerThreadScript.js"
		);
	}

	/**
	 * Method to set up queues for processing branches.
	 * @param args
	 */
	private async setupQueues(args: {
		branchesRepository: IPostofficeBranchesRepository;
		idCodePairRepository: IPostofficeCodeIdPairsRepository;
	}) {
		this.pathStack.push("Setup queues");
		try {
			const resultStatus = await repopulateUnprocessedBranchesQueue({
				branchesRepository: args.branchesRepository,
				idCodePairRepository: args.idCodePairRepository,
			});
			this.logger.logInfo({
				message: "resultStatus itemsInQueue",
				details: String(resultStatus.itemsInQueue ?? ""),
			});
			this.logger.logInfo({
				message: "resultStatus replacedAmount",
				details: String(resultStatus.replacedAmount ?? ""),
			});
		} finally {
			this.pathStack.pop();
		}
	}

	private async setupWorkers() {
		this.pathStack.push("Setup workers");
		try {
			const proxieEndpoints = await this.proxyEndpointsBuilder({
				envFilepath: this.envFilePath,
				proxyFilepath: this.proxyFilePath,
				envPasswordKey: "PROX_WBSHA_PAS",
				envUsernameKey: "PROX_WBSHA_USR",
			});

			this.logger.logInfo({
				message: "Proxy endpoints amount",
				details: String(proxieEndpoints.length ?? ""),
			});

			for (const proxyEndpoint of proxieEndpoints) {
				const ipManager = new WorkerWrapper({
					workerScript: this.ipManagerScriptPath,
					workerData: proxyEndpoint,
				});

				this.setupCallbacks(ipManager, ipManager.getID());
				this.IpManagers[ipManager.getID()] = ipManager;
				ipManager.sendMessage(IpManagerContinuesMessages.StartEndpoint);
			}
		} finally {
			this.pathStack.pop();
		}
	}

	private async setupCallbacks(ipManager: WorkerWrapper, threadId: number) {
		const instance = this;
		this.pathStack.push("Setup callbacks");
		try {
			ipManager.setCallbacks({
				onMessageCallback(message) {
					switch (message) {
						case ContinuesUpdateMessages.ManagerDepleted:
							instance.logger.logInfo({
								message: "IP Manager has no more requests left",
								threadId,
							});
							break;
						case ContinuesUpdateMessages.ManagerDone:
							instance.logger.logInfo({
								message: "IP Manager found no more branches to update",
								threadId,
							});
							break;
					}
				},
				onErrorCallback(error) {
					instance.logger.logInfo({
						message: "IP Manager Encountered an Error",
						threadId,
						details: error.message,
					});
				},
				onExitCallback(exitCode) {
					instance.logger.logInfo({
						message: "IP Manager Child thread has Exited/Terminated",
						threadId,
						details: exitCode,
					});
				},
			});
		} finally {
			this.pathStack.pop();
		}
	}

	// ########################################################
	// ### Class Services #####################################
	// ########################################################

	/**
	 * Test method to be used for setupIpManagement.
	 * @returns A promise that resolves when the setup is complete.
	 */
	async runUpdate() {
		await this.setupQueues({
			branchesRepository: this.branchesRepository,
			idCodePairRepository: this.idCodePairRepository,
		});
		await this.setupWorkers();
	}
}
