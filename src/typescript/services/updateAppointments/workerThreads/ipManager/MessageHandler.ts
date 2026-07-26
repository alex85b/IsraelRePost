import { threadId } from "worker_threads";
import { MemoryView } from "../../../../data/models/dataTransferModels/ThreadSharedMemory";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";
import {
	ConstructLogMessage,
	ILogMessageConstructor,
} from "../../../../shared/classes/ConstructLogMessage";
import { PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import {
	DepletedClaimsTracker,
	ITrackDepletedClaims,
} from "../../helpers/claimsTracker/DepletedClaimTracker";
import {
	IObserveSharedTracking,
	IResetSharedTracking,
} from "../../helpers/consumptionTracker/RequestTracker";
import { IRequestsBatchTracker } from "../../helpers/consumptionTracker/RequestsBatchTracker";
import {
	ICommunicationWrapper,
	IIdentifiable,
	WorkerWrapper,
} from "../../helpers/threadCommunication/CommunicationWrappers";
import {
	HandlerClass,
	IHandlerClass,
	MessageDataPair,
} from "../../helpers/threadCommunication/Handler";
import {
	AppointmentsUpdatingMessages,
	ContinuesUpdateMessages,
	IpManagerContinuesMessages,
	IpManagerUpdaterMessages,
	ThreadMessage,
} from "../../helpers/threadCommunication/Messages";
import { IConfigurable } from "../shared/configurable";
import { IStoppable } from "../shared/stoppable";

// ###############################################################################################
// ### Handle : Start endpoint ###################################################################
// ###############################################################################################

export interface IEndpointStarter {
	batchTracker: IRequestsBatchTracker;
	threadId: number;
	requestsPerMinuteLimit: number;
	parentCommunication: ICommunicationWrapper;
	sharedMemory: MemoryView;
	updaterScriptPath: string;
	pathStack: PathStack;
	proxyEndpoint?: string;
}

export interface IShutdownByKey<K> {
	shutDown(key: K): void;
}

export class HandleStartEndpoint
	extends HandlerClass<
		IEndpointStarter,
		IpManagerContinuesMessages.StartEndpoint
	>
	implements
		IStoppable,
		IConfigurable<MessageDataPair<typeof IpManagerUpdaterMessages>>,
		IShutdownByKey<number>
{
	// private logConstructor: ILogMessageConstructor;
	private logger: ILogger;
	private averageRequestsPerBranch = 8;

	private workers: {
		[threadId: number]: ICommunicationWrapper & IIdentifiable;
	} = {};
	private childHandlers:
		| MessageDataPair<typeof IpManagerUpdaterMessages>
		| undefined;

	constructor(buildArguments: IEndpointStarter) {
		super(buildArguments);
		this.data.pathStack
			.copy()
			.push("Handle Start endpoint")
			.push(`Thread ID ${this.data.threadId ?? -1}`);
		this.logger = new WinstonClient({ pathStack: this.data.pathStack });
	}

	async handle(): Promise<void> {
		const { allowedBatchSize, status } = await attemptNewRequestBatch({
			batchTracker: this.data.batchTracker,
			logger: this.logger,
			pathStack: this.data.pathStack,
			requestsPerMinuteLimit: this.data.requestsPerMinuteLimit,
		});
		if (status === "depleted" || allowedBatchSize === undefined) {
			this.data.parentCommunication.sendMessage(
				ContinuesUpdateMessages.ManagerDepleted
			);
			return; // Break; End.
		}
		this.data.requestsPerMinuteLimit = allowedBatchSize;

		const totalWorkers = Math.floor(
			this.data.requestsPerMinuteLimit / this.averageRequestsPerBranch
		);

		for (let workerIndex = 0; workerIndex < totalWorkers; workerIndex++) {
			const communicationWrapper: ICommunicationWrapper & IIdentifiable =
				new WorkerWrapper({
					workerScript: this.data.updaterScriptPath,
					workerData: {
						proxyEndpoint: this.data.proxyEndpoint,
						memoryView: this.data.sharedMemory,
						parentId: this.data.threadId ?? -1,
					},
				});
			this.workers[communicationWrapper.getID()] = communicationWrapper;
			if (this.childHandlers === undefined) {
				throw new ServiceError({
					message: "Message handlers were not provided",
					source: ErrorSource.ThirdPartyAPI,
					logger: this.logger,
					details: { worker: communicationWrapper.getID() },
				});
			}
			this.setupCommunicationWrapper({
				communicationWrapper: this.workers[communicationWrapper.getID()],
				ipManagerUpdaterHandlers: this.childHandlers,
				logger: this.logger,
				pathStack: this.data.pathStack,
				workers: this.workers,
				workerRemoval: this.deleteWorker,
			});
			communicationWrapper.sendMessage(
				AppointmentsUpdatingMessages.StartUpdates
			);
		}
	}

	private deleteWorker(args: {
		workerId: number;
		workers: { [threadId: number]: ICommunicationWrapper & IIdentifiable };
	}): boolean {
		if (Object.keys(args.workers).includes(String(args.workerId))) {
			delete args.workers[args.workerId];
			return true;
		}
		this.logger.logInfo({
			message: "worker targeted for deletion",
			details: { worker: args.workerId },
		});
		return false;
	}

	private setupCommunicationWrapper(args: {
		communicationWrapper: ICommunicationWrapper & IIdentifiable;
		ipManagerUpdaterHandlers: MessageDataPair<typeof IpManagerUpdaterMessages>;
		logger: ILogger;
		pathStack: PathStack;
		workers: { [threadId: number]: ICommunicationWrapper & IIdentifiable };
		workerRemoval: (args: {
			workerId: number;
			pathStack: PathStack;
			logger: ILogger;
			workers: { [threadId: number]: ICommunicationWrapper & IIdentifiable };
		}) => boolean;
	}) {
		const currentHandler = this;
		args.communicationWrapper.setCallbacks({
			onMessageCallback(message) {
				args.logger.logInfo({
					message: "Incoming message",
					details: {
						fromWorker: args.communicationWrapper.getID(),
						message,
					},
				});
				if (isIpManagerUpdaterMessage(message)) {
					args.ipManagerUpdaterHandlers[message].handle(
						args.communicationWrapper
					);
				} else {
					throw new ServiceError({
						message: "Unsupported thread message",
						logger: args.logger,
						source: ErrorSource.Internal,
						details: { fromWorker: args.communicationWrapper.getID(), message },
					});
				}
			},

			onErrorCallback(error) {
				args.logger.logError({
					message: "Incoming Error",
					details: {
						fromWorker: args.communicationWrapper.getID(),
						error: error.message,
					},
				});
				args.workerRemoval({
					workerId: args.communicationWrapper.getID(),
					workers: args.workers,
					logger: currentHandler.logger,
					pathStack: currentHandler.data.pathStack,
				});
				if (!Object.keys(args.workers).length) process.exit(0);
			},

			onExitCallback(exitCode) {
				currentHandler.logger.logInfo({
					message: "On exit code",
					details: { fromWorker: args.communicationWrapper.getID(), exitCode },
				});
				args.workerRemoval({
					logger: currentHandler.logger,
					pathStack: currentHandler.data.pathStack,
					workerId: args.communicationWrapper.getID(),
					workers: args.workers,
				});
				if (!Object.keys(args.workers).length) process.exit(0);
			},
		});
	}

	stop(): void {
		this.data.pathStack.push("Stop request");
		try {
			this.logger.logInfo({
				message: "Stop request",
				details: "Endpoint stoppage",
			});
			for (const workerID in this.workers) {
				this.workers[workerID].sendMessage(
					AppointmentsUpdatingMessages.EndUpdater
				);
			}
		} finally {
			this.data.pathStack.pop();
		}
	}

	shutDown(key: number): void {
		this.data.pathStack.push("Shut down Event");
		try {
			this.logger.logInfo({
				message: `Worker ${key} Closure`,
			});
			this.workers[key].sendMessage(AppointmentsUpdatingMessages.EndUpdater);
		} finally {
			this.data.pathStack.pop();
		}
	}

	configure(args: MessageDataPair<typeof IpManagerUpdaterMessages>): void {
		this.childHandlers = args;
	}
}

const isIpManagerUpdaterMessage = (
	message: ThreadMessage
): message is IpManagerUpdaterMessages => {
	return Object.values(IpManagerUpdaterMessages).includes(
		message as IpManagerUpdaterMessages
	);
};

// ###############################################################################################
// ### Handle : End endpoint ###################################################################
// ###############################################################################################

export interface IEndpointEnder {
	RuningEndpoint: IStoppable &
		HandlerClass<any, IpManagerContinuesMessages.StartEndpoint>;
	threadId: number;
	pathStack: PathStack;
}

export class HandleEndEndpoint extends HandlerClass<
	IEndpointEnder,
	IpManagerContinuesMessages.EndEndpoint
> {
	private logger: ILogger;

	constructor(args: IEndpointEnder) {
		super(args);
		this.logger = new WinstonClient({
			pathStack: this.data.pathStack.copy().push("Handle End Endpoint"),
		});
	}

	handle(worker?: ICommunicationWrapper & IIdentifiable): Promise<void> | void {
		this.logger.logInfo({ message: "Endpoint requested to end activity" });
		this.data.RuningEndpoint.stop();
	}
}

// ###############################################################################################
// ### Handle : Updater Depleted #################################################################
// ###############################################################################################

export interface IEndpointRestart {
	//worker: ICommunicationWrapper & IIdentifiable;
	threadId: number;
	sharedTracking: IObserveSharedTracking & IResetSharedTracking;
	batchTracker: IRequestsBatchTracker;
	requestsPerMinuteLimit: number;
	parentCommunication: ICommunicationWrapper;
	pathStack: PathStack;
}

export class HandleUpdaterDepleted extends HandlerClass<
	IEndpointRestart,
	IpManagerUpdaterMessages.UpdaterDepleted
> {
	private capturedWorkers: ICommunicationWrapper[] = [];
	private depletedClaimsTracker: ITrackDepletedClaims;
	private logger: ILogger;

	constructor(args: IEndpointRestart) {
		super(args);
		this.data.pathStack
			.copy()
			.push("HandleUpdaterDepleted")
			.push(`Thread ID ${this.data.threadId ?? -1}`);
		this.logger = new WinstonClient({ pathStack: this.data.pathStack });
		this.depletedClaimsTracker = new DepletedClaimsTracker();
	}

	async handle(worker?: ICommunicationWrapper & IIdentifiable): Promise<void> {
		const instanceReference = this;
		if (!worker) {
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Internal,
				message: "No ICommunicationWrapper has been provided",
			});
		}

		// If the Depleted claim is invalid.
		if (
			this.data.sharedTracking.observeTracking() <
			this.data.requestsPerMinuteLimit
		) {
			worker.sendMessage(AppointmentsUpdatingMessages.ContinueUpdates);
			return; // Break; End.
		} // At this point i know the claim IS valid.

		this.capturedWorkers.push(worker);
		if (this.depletedClaimsTracker.track().authorized) {
			const { allowedBatchSize, status } = await attemptNewRequestBatch({
				batchTracker: this.data.batchTracker,
				requestsPerMinuteLimit: this.data.requestsPerMinuteLimit,
				logger: this.logger,
				pathStack: this.data.pathStack,
			});

			if (status === "depleted" || allowedBatchSize === undefined) {
				this.data.parentCommunication.sendMessage(
					ContinuesUpdateMessages.ManagerDepleted
				);
				return; // Break; End.
			}
			this.data.requestsPerMinuteLimit = allowedBatchSize;

			this.logger.logInfo({
				message: "Entering a timout",
				threadId: threadId,
			});

			await new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 61000);
			});

			this.logger.logInfo({
				message: "Perforemed a timout",
				threadId: threadId,
			});

			this.data.sharedTracking.resetTracking({
				sharedLimit: allowedBatchSize,
			});

			this.depletedClaimsTracker.reset();

			while (instanceReference.capturedWorkers.length) {
				const worker = instanceReference.capturedWorkers.shift();
				if (!worker) break;
				worker.sendMessage(AppointmentsUpdatingMessages.ContinueUpdates);
			}
		}
	}
}

// ###############################################################################################
// ### Handle : Updater Done #####################################################################
// ###############################################################################################

export class HandleUpdaterDone extends HandlerClass<
	{ shutDownTarget: IShutdownByKey<number>; threadId: number },
	IpManagerUpdaterMessages.UpdaterDone
> {
	private logConstructor: ILogMessageConstructor;

	constructor(args: {
		shutDownTarget: IShutdownByKey<number>;
		threadId: number;
	}) {
		super(args);
		this.logConstructor = new ConstructLogMessage([
			"HandleUpdaterDone",
			`Thread ID ${this.data.threadId ?? -1}`,
		]);
	}
	handle(
		worker?: (ICommunicationWrapper & IIdentifiable) | undefined
	): void | Promise<void> {
		const instanceReference = this;
		if (!worker) {
			throw Error(
				this.logConstructor.createLogMessage({
					subject: "No ICommunicationWrapper has been provided",
				})
			);
		}
		this.data.shutDownTarget.shutDown(worker.getID());
	}
}

// ###############################################################################################
// ### Helpers ###################################################################################
// ###############################################################################################

const attemptNewRequestBatch = async (args: {
	batchTracker: IRequestsBatchTracker;
	requestsPerMinuteLimit: number;
	logger: ILogger;
	pathStack: PathStack;
}): Promise<{
	status: "depleted" | "allowed";
	allowedBatchSize: number | undefined;
}> => {
	const { authorized, requestsLeft } =
		await args.batchTracker.trackRequestBatch({
			batchSize: args.requestsPerMinuteLimit,
		});
	if (!authorized) {
		if (requestsLeft > 0) {
			return {
				status: "allowed",
				allowedBatchSize: requestsLeft,
			};
		} else {
			args.logger.logInfo({
				message: "No requests left in the total request pool",
			});
			return {
				status: "depleted",
				allowedBatchSize: undefined,
			};
		}
	}
	return {
		status: "allowed",
		allowedBatchSize: args.requestsPerMinuteLimit,
	};
};
