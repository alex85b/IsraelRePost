import { IBranchIdQnomyCodePair } from "../../../../data/models/persistenceModels/PostofficeBranchIdCodePair";
import { IPostofficeBranchServicesBuilder } from "../../../../data/models/persistenceModels/PostofficeBranchServices";
import { IPostofficeUpdateErrorBuilder } from "../../../../data/models/persistenceModels/UpdateErrorRecord";
import { IPostofficeBranchesRepository } from "../../../../data/repositories/PostofficeBranchesRepository";
import { IPostofficeCodeIdPairsRepository } from "../../../../data/repositories/PostofficeCodeIdPairsRepository";
import { IUpdateErrorRecordsRepository } from "../../../../data/repositories/UpdateErrorRecordsRepository";
import { ErrorSource, ServiceError } from "../../../../errors/ServiceError";
import { PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import { IReseLocalTracking } from "../../helpers/consumptionTracker/RequestTracker";
import { ICommunicationWrapper } from "../../helpers/threadCommunication/CommunicationWrappers";
import { HandlerClass } from "../../helpers/threadCommunication/Handler";
import {
	AppointmentsUpdatingMessages,
	IpManagerUpdaterMessages,
} from "../../helpers/threadCommunication/Messages";
import { IConstructServicesRecord } from "../../helpers/updateServicesRecord/ConstructServicesRecord";
import { IStoppable } from "../shared/stoppable";

// ###############################################################################################
// ### Handle : Start update #####################################################################
// ###############################################################################################

export interface IUpdateStarter {
	codeIdPairRepo: IPostofficeCodeIdPairsRepository;
	parentCommunication: ICommunicationWrapper;
	constructServices: IConstructServicesRecord;
	errorRecordsRepository: IUpdateErrorRecordsRepository;
	branchesRepository: IPostofficeBranchesRepository;
	threadId: number;
	parentId: number;
	pathStack: PathStack;
	endpointProxyString?: string;
}

export class HandleStartUpdates
	extends HandlerClass<
		IUpdateStarter,
		AppointmentsUpdatingMessages.StartUpdates
	>
	implements IStoppable
{
	private stopRequested: boolean;
	private logger: ILogger;

	constructor(buildArguments: IUpdateStarter) {
		super(buildArguments);
		this.stopRequested = false;
		this.data.pathStack = new PathStack()
			.push("Handle Start updates")
			.push(`Parent ID ${this.data.parentId ?? -1}`)
			.push(`Thread ID ${this.data.threadId ?? -1}`);
		this.logger = new WinstonClient({ pathStack: this.data.pathStack });
	}

	stop(): void {
		this.logger.logInfo({
			message: "Update stoppage",
			details: "Stop request",
		});
		this.stopRequested = true;
	}

	async handle(): Promise<void> {
		do {
			const idQnomecodePair =
				await this.data.codeIdPairRepo.popUnprocessedPair();
			const response = await newUpdate({
				...this.data,
				branchIdQnomycode: idQnomecodePair,
				pathStack: this.data.pathStack,
				logger: this.logger,
			});
			switch (response) {
				case IpManagerUpdaterMessages.UpdaterDepleted:
					break;
				case IpManagerUpdaterMessages.UpdaterDone:
					break;
				case "OK":
					break;
				default:
					break;
			}
			if (response === IpManagerUpdaterMessages.UpdaterDepleted) {
				this.data.parentCommunication.sendMessage(
					IpManagerUpdaterMessages.UpdaterDepleted
				);
				return; // break; End;
			}
			if (response === IpManagerUpdaterMessages.UpdaterDone) {
				await this.data.codeIdPairRepo.pushProcessedPair(idQnomecodePair!);
				this.data.parentCommunication.sendMessage(
					IpManagerUpdaterMessages.UpdaterDone
				);
				return; // break; End;
			}
			if (response === "OK") {
				await this.data.codeIdPairRepo.pushProcessedPair(idQnomecodePair!);
				// Next branch
			}
		} while (!this.stopRequested);
	}
}

// ###############################################################################################
// #### Handle : Stop updates ####################################################################
// ###############################################################################################

export class HandleStopUpdates extends HandlerClass<
	{
		ongoingUpdaters: IStoppable[];
	},
	AppointmentsUpdatingMessages.StopUpdates
> {
	constructor(buildArguments: { ongoingUpdaters: IStoppable[] }) {
		super(buildArguments);
	}

	handle(): void {
		this.data.ongoingUpdaters.forEach((stoppable) => {
			stoppable.stop();
		});
	}
}

// ###############################################################################################
// #### Handle : End updater #####################################################################
// ###############################################################################################

export class HandleEndUpdater extends HandlerClass<
	{
		ongoingUpdaters: IStoppable[];
		processTerminator: (code?: number | undefined) => never;
	},
	AppointmentsUpdatingMessages.StopUpdates
> {
	constructor(buildArguments: {
		ongoingUpdaters: IStoppable[];
		processTerminator: (code?: number | undefined) => never;
	}) {
		super(buildArguments);
	}

	handle(): void {
		this.data.ongoingUpdaters.forEach((stoppable) => {
			stoppable.stop();
		});
		this.data.processTerminator(1);
	}
}

// ###############################################################################################
// ### Handle : Continue update ##################################################################
// ###############################################################################################

export interface IUpdateContinuer extends IUpdateStarter {
	resetTracking: IReseLocalTracking;
}

export class HandleContinueUpdates
	extends HandlerClass<
		IUpdateContinuer,
		AppointmentsUpdatingMessages.StartUpdates
	>
	implements IStoppable
{
	private stopRequested: boolean;
	private pathStack: PathStack;
	private logger: ILogger;

	constructor(buildArguments: IUpdateContinuer) {
		super(buildArguments);
		this.stopRequested = false;
		this.pathStack = new PathStack()
			.push("Handle Continue updates")
			.push(`Parent ID ${this.data.parentId ?? -1}`)
			.push(`Thread ID ${this.data.threadId ?? -1}`);
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	stop(): void {
		this.logger.logInfo({
			message: "Update stoppage",
			details: "Stop request",
		});
		this.stopRequested = true;
	}

	async handle(): Promise<void> {
		// Initiate continue update.
		this.data.resetTracking.resetLocally();
		const { currentIdQnomycode, status } = await continuePausedUpdate({
			...this.data,
			pathStack: this.pathStack,
			logger: this.logger,
		});
		if (status === IpManagerUpdaterMessages.UpdaterDepleted) {
			this.data.parentCommunication.sendMessage(
				IpManagerUpdaterMessages.UpdaterDepleted
			);
			return; // break; End;
		}
		if (status === "OK" && currentIdQnomycode) {
			this.data.codeIdPairRepo.pushProcessedPair(currentIdQnomycode);
		}
		this.logger.logInfo({ message: "Paused update was handled" });
		do {
			const idQnomecodePair =
				await this.data.codeIdPairRepo.popUnprocessedPair();
			const response = await newUpdate({
				...this.data,
				branchIdQnomycode: idQnomecodePair,
				logger: this.logger,
				pathStack: this.pathStack,
			});
			if (response === IpManagerUpdaterMessages.UpdaterDepleted) {
				this.data.parentCommunication.sendMessage(
					IpManagerUpdaterMessages.UpdaterDepleted
				);
				return; // break; End;
			}
			if (response === IpManagerUpdaterMessages.UpdaterDone) {
				await this.data.codeIdPairRepo.pushProcessedPair(idQnomecodePair!);
				this.data.parentCommunication.sendMessage(
					IpManagerUpdaterMessages.UpdaterDone
				);
				return; // break; End;
			}
			if (response === "OK") {
				await this.data.codeIdPairRepo.pushProcessedPair(idQnomecodePair!);
				// Next branch
			}
		} while (!this.stopRequested);
	}
}

// ###############################################################################################
// ### Helper Function : New Update ##############################################################
// ###############################################################################################

const newUpdate = async (args: {
	branchIdQnomycode: IBranchIdQnomyCodePair | null;
	constructServices: IConstructServicesRecord;
	pathStack: PathStack;
	logger: ILogger;
	errorRecordsRepository: IUpdateErrorRecordsRepository;
	branchesRepository: IPostofficeBranchesRepository;
	endpointProxyString?: string;
}): Promise<
	| IpManagerUpdaterMessages.UpdaterDone
	| IpManagerUpdaterMessages.UpdaterDepleted
	| "OK"
> => {
	args.pathStack
		.push("New update")
		.push(args.branchIdQnomycode?.branchId ?? "-1");
	try {
		if (!args.branchIdQnomycode) return IpManagerUpdaterMessages.UpdaterDone;
		const { status, errorsBuilder, servicesBuilder } =
			await args.constructServices.constructRecord({
				serviceIdAndQnomycode: args.branchIdQnomycode,
				endpointProxyString: args.endpointProxyString,
			});
		switch (status) {
			case "OK":
				await persistRecord({
					...args,
					errorsBuilder,
					servicesBuilder,
					currentIdQnomycode: args.branchIdQnomycode,
				});
				return status;
			case "overflow":
			case "above limit":
				args.logger.logInfo({
					message: "Request tracker status",
					details: { status },
				});
				return IpManagerUpdaterMessages.UpdaterDepleted;
			default:
				throw new ServiceError({
					message: "Unsupported update status",
					source: ErrorSource.ThirdPartyAPI,
					logger: args.logger,
					details: { status },
				});
		}
	} finally {
		args.pathStack.pop().pop();
	}
};

// ###############################################################################################
// ### Helper Function : Continue Paused Update ##################################################
// ###############################################################################################

const continuePausedUpdate = async (args: {
	codeIdPairRepo: IPostofficeCodeIdPairsRepository;
	constructServices: IConstructServicesRecord;
	pathStack: PathStack;
	logger: ILogger;
	errorRecordsRepository: IUpdateErrorRecordsRepository;
	branchesRepository: IPostofficeBranchesRepository;
	endpointProxyString?: string;
}): Promise<{
	status: "empty queue" | "OK" | IpManagerUpdaterMessages.UpdaterDepleted;
	currentIdQnomycode: IBranchIdQnomyCodePair | undefined;
}> => {
	args.pathStack.push("Continue Paused update");
	try {
		const { errorsBuilder, servicesBuilder, status, currentIdQnomycode } =
			await args.constructServices.continuePausedConstruction({
				endpointProxyString: args.endpointProxyString,
			});
		if (!currentIdQnomycode)
			throw new ServiceError({
				message: "No Branch ID Qnomycode",
				source: ErrorSource.ThirdPartyAPI,
				logger: args.logger,
			});
		args.pathStack.push(`Branch ID: ${currentIdQnomycode.branchId}`);
		switch (status) {
			case "OK":
				await persistRecord({
					...args,
					errorsBuilder,
					servicesBuilder,
					currentIdQnomycode,
				});
				return { status, currentIdQnomycode };
			case "empty queue":
				args.logger.logInfo({
					message: `Update delayed due to ${status}`,
				});
				return { status, currentIdQnomycode: currentIdQnomycode };
			case "above limit":
			case "overflow":
				args.logger.logInfo({
					message: `Update delayed due to ${status}`,
				});
				return {
					status: IpManagerUpdaterMessages.UpdaterDepleted,
					currentIdQnomycode,
				};
			default:
				throw new ServiceError({
					message: "Unsupported update status",
					source: ErrorSource.ThirdPartyAPI,
					logger: args.logger,
					details: { status },
				});
		}
	} finally {
		args.pathStack.pop().pop();
	}
};

// ###############################################################################################
// ### Helper Function : Persist Record ##########################################################
// ###############################################################################################

const persistRecord = async (args: {
	errorRecordsRepository: IUpdateErrorRecordsRepository;
	branchesRepository: IPostofficeBranchesRepository;
	errorsBuilder: IPostofficeUpdateErrorBuilder;
	servicesBuilder: IPostofficeBranchServicesBuilder;
	currentIdQnomycode: IBranchIdQnomyCodePair;
	pathStack: PathStack;
	logger: ILogger;
}): Promise<void> => {
	const errorModel = args.errorsBuilder.build(args.currentIdQnomycode.branchId);
	const servicesModel = args.servicesBuilder.build(
		args.currentIdQnomycode.branchId
	);
	if (errorModel.getErrorsCount() > 0) {
		args.logger.logInfo({
			message: "Update faulted",
			details: { branchId: args.currentIdQnomycode.branchId },
		});
		args.errorRecordsRepository.addUpdateErrorRecord({
			errorModel,
		});
	} else
		args.logger.logInfo({
			message: "Updated",
			details: { branchId: args.currentIdQnomycode.branchId },
		});
	args.branchesRepository.updateBranchServices({
		servicesModel,
	});
};
