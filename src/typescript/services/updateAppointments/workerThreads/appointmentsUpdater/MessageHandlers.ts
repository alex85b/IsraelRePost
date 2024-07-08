import { IBranchIdQnomyCodePair } from "../../../../data/models/persistenceModels/PostofficeBranchIdCodePair";
import { IPostofficeBranchServicesBuilder } from "../../../../data/models/persistenceModels/PostofficeBranchServices";
import { IPostofficeUpdateErrorBuilder } from "../../../../data/models/persistenceModels/UpdateErrorRecord";
import { IPostofficeBranchesRepository } from "../../../../data/repositories/PostofficeBranchesRepository";
import { IPostofficeCodeIdPairsRepository } from "../../../../data/repositories/PostofficeCodeIdPairsRepository";
import { IUpdateErrorRecordsRepository } from "../../../../data/repositories/UpdateErrorRecordsRepository";
import {
	ConstructLogMessage,
	ILogMessageConstructor,
} from "../../../../shared/classes/ConstructLogMessage";
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
	private logConstructor: ILogMessageConstructor;

	constructor(buildArguments: IUpdateStarter) {
		super(buildArguments);
		this.stopRequested = false;
		this.logConstructor = new ConstructLogMessage([
			"HandleStartUpdates",
			`Parent ID ${this.data.parentId ?? -1}`,
			`Thread ID ${this.data.threadId ?? -1}`,
		]);
	}

	stop(): void {
		this.logConstructor.addLogHeader("Stop request");
		console.log(
			this.logConstructor.createLogMessage({ subject: "Update stoppage" })
		);
		this.stopRequested = true;
	}

	async handle(): Promise<void> {
		do {
			const idQnomecodePair =
				await this.data.codeIdPairRepo.popUnprocessedPair();
			const response = await newUpdate({
				...this.data,
				branchIdQnomycode: idQnomecodePair,
				logConstructor: this.logConstructor,
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
	private logConstructor: ILogMessageConstructor;

	constructor(buildArguments: IUpdateContinuer) {
		super(buildArguments);
		this.stopRequested = false;
		this.logConstructor = new ConstructLogMessage([
			"HandleContinueUpdates",
			`Parent ID ${this.data.parentId ?? -1}`,
			`Thread ID ${this.data.threadId ?? -1}`,
		]);
	}

	stop(): void {
		this.logConstructor.addLogHeader("Stop request");
		console.log(
			this.logConstructor.createLogMessage({ subject: "Update stoppage" })
		);
		this.stopRequested = true;
	}

	async handle(): Promise<void> {
		// Initiate continue update.
		this.data.resetTracking.resetLocally();
		const { currentIdQnomycode, status } = await continuePausedUpdate({
			...this.data,
			logConstructor: this.logConstructor,
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
		this.logConstructor.createLogMessage({
			subject: "Paused update was handled",
		});
		do {
			const idQnomecodePair =
				await this.data.codeIdPairRepo.popUnprocessedPair();
			const response = await newUpdate({
				...this.data,
				branchIdQnomycode: idQnomecodePair,
				logConstructor: this.logConstructor,
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
	logConstructor: ILogMessageConstructor;
	errorRecordsRepository: IUpdateErrorRecordsRepository;
	branchesRepository: IPostofficeBranchesRepository;
	endpointProxyString?: string;
}): Promise<
	| IpManagerUpdaterMessages.UpdaterDone
	| IpManagerUpdaterMessages.UpdaterDepleted
	| "OK"
> => {
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
			console.log(
				args.logConstructor.createLogMessage({
					subject: `Branch ID ${args.branchIdQnomycode.branchId} Request tracker status`,
					message: status,
				})
			);
			return IpManagerUpdaterMessages.UpdaterDepleted;
		default:
			throw Error(
				args.logConstructor.createLogMessage({
					subject: `Unsupported update status ${status}`,
				})
			);
	}
};

// ###############################################################################################
// ### Helper Function : Continue Paused Update ##################################################
// ###############################################################################################

const continuePausedUpdate = async (args: {
	codeIdPairRepo: IPostofficeCodeIdPairsRepository;
	constructServices: IConstructServicesRecord;
	logConstructor: ILogMessageConstructor;
	errorRecordsRepository: IUpdateErrorRecordsRepository;
	branchesRepository: IPostofficeBranchesRepository;
	endpointProxyString?: string;
}): Promise<{
	status: "empty queue" | "OK" | IpManagerUpdaterMessages.UpdaterDepleted;
	currentIdQnomycode: IBranchIdQnomyCodePair | undefined;
}> => {
	const { errorsBuilder, servicesBuilder, status, currentIdQnomycode } =
		await args.constructServices.continuePausedConstruction({
			endpointProxyString: args.endpointProxyString,
		});
	if (!currentIdQnomycode)
		throw Error(
			args.logConstructor.createLogMessage({
				subject: "No Branch ID Qnomycode",
			})
		);
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
			console.log(
				args.logConstructor.createLogMessage({
					subject: `Update delayed due to ${status}`,
					message: "Branch ID " + currentIdQnomycode.branchId,
				})
			);
			return { status, currentIdQnomycode: currentIdQnomycode };
		case "above limit":
		case "overflow":
			console.log(
				args.logConstructor.createLogMessage({
					subject: `Update delayed due to ${status}`,
					message: "Branch ID " + currentIdQnomycode.branchId,
				})
			);
			return {
				status: IpManagerUpdaterMessages.UpdaterDepleted,
				currentIdQnomycode,
			};
		default:
			throw Error(
				args.logConstructor.createLogMessage({
					subject: `Unsupported update status ${status}`,
				})
			);
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
	logConstructor: ILogMessageConstructor;
}): Promise<void> => {
	const errorModel = args.errorsBuilder.build(args.currentIdQnomycode.branchId);
	const servicesModel = args.servicesBuilder.build(
		args.currentIdQnomycode.branchId
	);
	if (errorModel.getErrorsCount() > 0) {
		console.log(
			args.logConstructor.createLogMessage({
				subject: "Update faulted",
				message: "Branch ID " + args.currentIdQnomycode.branchId,
			})
		);
		args.errorRecordsRepository.addUpdateErrorRecord({
			errorModel,
		});
	} else
		console.log(
			args.logConstructor.createLogMessage({
				subject: "Updated",
				message: "Branch ID " + args.currentIdQnomycode.branchId,
			})
		);
	args.branchesRepository.updateBranchServices({
		servicesModel,
	});
};
