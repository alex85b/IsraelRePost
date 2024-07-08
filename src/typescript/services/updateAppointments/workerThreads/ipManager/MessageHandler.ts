import { MemoryView } from "../../../../data/models/dataTransferModels/ThreadSharedMemory";
import {
	ConstructLogMessage,
	ILogMessageConstructor,
} from "../../../../shared/classes/ConstructLogMessage";
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
	private logConstructor: ILogMessageConstructor;
	private averageRequestsPerBranch = 8;
	private workers: {
		[threadId: number]: ICommunicationWrapper & IIdentifiable;
	} = {};
	private childHandlers:
		| MessageDataPair<typeof IpManagerUpdaterMessages>
		| undefined;

	constructor(buildArguments: IEndpointStarter) {
		super(buildArguments);
		this.logConstructor = new ConstructLogMessage([
			"HandleStartEndpoint",
			`Thread ID ${this.data.threadId ?? -1}`,
		]);
	}

	async handle(): Promise<void> {
		const { allowedBatchSize, status } = await attemptNewRequestBatch({
			batchTracker: this.data.batchTracker,
			logConstructor: this.logConstructor,
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
				throw Error(
					this.logConstructor.createLogMessage({
						subject: `Message handlers for the worker ${communicationWrapper.getID()} were not provided`,
					})
				);
			}
			this.setupCommunicationWrapper({
				communicationWrapper: this.workers[communicationWrapper.getID()],
				ipManagerUpdaterHandlers: this.childHandlers,
				logConstructor: this.logConstructor,
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
		logConstructor: ILogMessageConstructor;
		workers: { [threadId: number]: ICommunicationWrapper & IIdentifiable };
	}): boolean {
		if (Object.keys(args.workers).includes(String(args.workerId))) {
			delete args.workers[args.workerId];
			return true;
		}
		console.log(
			args.logConstructor.createLogMessage({
				subject: `worker targeted for deletion ${args.workerId}`,
			})
		);
		console.log(
			args.logConstructor.createLogMessage({
				subject: "workers",
				message: JSON.stringify(args.workers, null, 4),
			})
		);
		return false;
	}

	private setupCommunicationWrapper(args: {
		communicationWrapper: ICommunicationWrapper & IIdentifiable;
		ipManagerUpdaterHandlers: MessageDataPair<typeof IpManagerUpdaterMessages>;
		logConstructor: ILogMessageConstructor;
		workers: { [threadId: number]: ICommunicationWrapper & IIdentifiable };
		workerRemoval: (args: {
			workerId: number;
			logConstructor: ILogMessageConstructor;
			workers: { [threadId: number]: ICommunicationWrapper & IIdentifiable };
		}) => boolean;
	}) {
		args.communicationWrapper.setCallbacks({
			onMessageCallback(message) {
				console.log(
					args.logConstructor.createLogMessage({
						subject: `From ${args.communicationWrapper.getID()} On message`,
						message,
					})
				);
				if (isIpManagerUpdaterMessage(message)) {
					args.ipManagerUpdaterHandlers[message].handle(
						args.communicationWrapper
					);
				} else {
					throw Error(
						args.logConstructor.createLogMessage({
							subject: `Unsupported thread ${args.communicationWrapper.getID()} message`,
							message,
						})
					);
				}
			},

			onErrorCallback(error) {
				console.log(
					args.logConstructor.createLogMessage({
						subject: "On error",
						message: error.message,
					})
				);
				args.workerRemoval({
					logConstructor: args.logConstructor,
					workerId: args.communicationWrapper.getID(),
					workers: args.workers,
				});
				if (!Object.keys(args.workers).length) process.exit(0);
			},

			onExitCallback(exitCode) {
				console.log(
					args.logConstructor.createLogMessage({
						subject: "On exit code",
						message: String(exitCode),
					})
				);
				args.workerRemoval({
					logConstructor: args.logConstructor,
					workerId: args.communicationWrapper.getID(),
					workers: args.workers,
				});
				if (!Object.keys(args.workers).length) process.exit(0);
			},
		});
	}

	stop(): void {
		this.logConstructor.addLogHeader("Stop request");
		console.log(
			this.logConstructor.createLogMessage({ subject: "Endpoint stoppage" })
		);
		for (const workerID in this.workers) {
			this.workers[workerID].sendMessage(
				AppointmentsUpdatingMessages.EndUpdater
			);
		}
	}

	shutDown(key: number): void {
		console.log(
			this.logConstructor.createLogMessage({ subject: `Worker ${key} Closure` })
		);
		this.workers[key].sendMessage(AppointmentsUpdatingMessages.EndUpdater);
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
}

export class HandleEndEndpoint extends HandlerClass<
	IEndpointEnder,
	IpManagerContinuesMessages.EndEndpoint
> {
	private logConstructor: ILogMessageConstructor;

	constructor(args: IEndpointEnder) {
		super(args);
		this.logConstructor = new ConstructLogMessage([
			"HandleEndEndpoint",
			`Thread ID ${this.data.threadId ?? -1}`,
		]);
	}

	handle(worker?: ICommunicationWrapper & IIdentifiable): Promise<void> | void {
		console.log(
			this.logConstructor.createLogMessage({
				subject: "Endpoint requested to end activity.",
			})
		);
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
}

export class HandleUpdaterDepleted extends HandlerClass<
	IEndpointRestart,
	IpManagerUpdaterMessages.UpdaterDepleted
> {
	private capturedWorkers: ICommunicationWrapper[] = [];
	private logConstructor: ILogMessageConstructor;
	private depletedClaimsTracker: ITrackDepletedClaims;

	constructor(args: {
		//worker: ICommunicationWrapper & IIdentifiable;
		threadId: number;
		sharedTracking: IObserveSharedTracking & IResetSharedTracking;
		batchTracker: IRequestsBatchTracker;
		requestsPerMinuteLimit: number;
		parentCommunication: ICommunicationWrapper;
	}) {
		super(args);
		this.logConstructor = new ConstructLogMessage([
			"HandleUpdaterDepleted",
			`Thread ID ${this.data.threadId ?? -1}`,
		]);
		this.depletedClaimsTracker = new DepletedClaimsTracker();
	}

	async handle(worker?: ICommunicationWrapper & IIdentifiable): Promise<void> {
		const instanceReference = this;
		if (!worker) {
			throw Error(
				this.logConstructor.createLogMessage({
					subject: "No ICommunicationWrapper has been provided",
				})
			);
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
				logConstructor: this.logConstructor,
				requestsPerMinuteLimit: this.data.requestsPerMinuteLimit,
			});

			if (status === "depleted" || allowedBatchSize === undefined) {
				this.data.parentCommunication.sendMessage(
					ContinuesUpdateMessages.ManagerDepleted
				);
				return; // Break; End.
			}
			this.data.requestsPerMinuteLimit = allowedBatchSize;

			console.log(
				this.logConstructor.createLogMessage({
					subject: "Entering a timout",
					message: new Date().toISOString(),
				})
			);

			await new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 61000);
			});

			console.log(
				this.logConstructor.createLogMessage({
					subject: "Perforemed a timout",
					message: new Date().toISOString(),
				})
			);

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
	{ workers: IShutdownByKey<number>; threadId: number },
	IpManagerUpdaterMessages.UpdaterDone
> {
	private logConstructor: ILogMessageConstructor;

	constructor(args: { workers: IShutdownByKey<number>; threadId: number }) {
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
		this.data.workers.shutDown(worker.getID());
	}
}

// ###############################################################################################
// ### Helpers ###################################################################################
// ###############################################################################################

const attemptNewRequestBatch = async (args: {
	batchTracker: IRequestsBatchTracker;
	requestsPerMinuteLimit: number;
	logConstructor: ILogMessageConstructor;
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
			console.log(
				args.logConstructor.createLogMessage({
					subject: "No requests left in the total request pool",
				})
			);
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
