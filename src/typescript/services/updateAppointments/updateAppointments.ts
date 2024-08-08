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

/**
 * Represents the first level of depth in the continuous update tree.
 * Communicates directly with the second level: 'Ip Managers' Worker threads.
 */
export class UpdateAppointmentsRoot {
	private IpManagers: { [key: number]: WorkerWrapper | null } = {};
	private branchesRepository: IPostofficeBranchesRepository;
	private idCodePairRepository: IPostofficeCodeIdPairsRepository;
	private messageConstructor: ILogMessageConstructor;
	private proxyEndpointsBuilder: IEndpointsFileToArray;

	private proxyFilePath: string;
	private envFilePath: string;
	private ipManagerScriptPath: string;

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
		this.branchesRepository =
			args.branchesRepository ?? new PostofficeBranchesRepository();
		this.idCodePairRepository =
			args.idCodePairRepository ?? new PostofficeCodeIdPairsRepository();
		this.messageConstructor = new ConstructLogMessage([
			"Update Appointments Root",
		]);
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
		const resultStatus = await repopulateUnprocessedBranchesQueue({
			branchesRepository: args.branchesRepository,
			idCodePairRepository: args.idCodePairRepository,
		});
		this.messageConstructor.addLogHeader("setupQueues");
		console.log(
			this.messageConstructor.createLogMessage({
				subject: "resultStatus itemsInQueue",
				message: String(resultStatus.itemsInQueue ?? ""),
			})
		);
		console.log(
			this.messageConstructor.createLogMessage({
				subject: "resultStatus replacedAmount",
				message: String(resultStatus.replacedAmount ?? ""),
			})
		);
	}

	private async setupWorkers() {
		const proxieEndpoints = await this.proxyEndpointsBuilder({
			envFilepath: this.envFilePath,
			proxyFilepath: this.proxyFilePath,
			envPasswordKey: "PROX_WBSHA_PAS",
			envUsernameKey: "PROX_WBSHA_USR",
		});

		this.messageConstructor.createLogMessage({
			subject: "Proxy endpoints amount",
			message: String(proxieEndpoints.length),
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
	}

	private async setupCallbacks(ipManager: WorkerWrapper, threadId: number) {
		const instance = this;
		ipManager.setCallbacks({
			onMessageCallback(message) {
				switch (message) {
					case ContinuesUpdateMessages.ManagerDepleted:
						console.log(
							instance.messageConstructor.createLogMessage({
								subject: `Ip Manager ${threadId} has no more requests left`,
							})
						);
						break;
					case ContinuesUpdateMessages.ManagerDone:
						console.log(
							instance.messageConstructor.createLogMessage({
								subject: `Ip Manager ${threadId} found no more branches to update`,
							})
						);
						break;
				}
			},
			onErrorCallback(error) {
				console.log(
					instance.messageConstructor.createLogMessage({
						subject: `Ip Manager ${threadId} Encountered an Error`,
						message: error.message,
					})
				);
			},
			onExitCallback(exitCode) {
				console.log(
					instance.messageConstructor.createLogMessage({
						subject: `Ip Manager ${threadId} Exited: ${exitCode}`,
					})
				);
			},
		});
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
