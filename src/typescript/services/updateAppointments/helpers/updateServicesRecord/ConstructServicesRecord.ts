import { IBranchIdQnomyCodePair } from "../../../../data/models/persistenceModels/PostofficeBranchIdCodePair";
import {
	IPostofficeBranchServicesBuilder,
	PostofficeBranchServicesBuilder,
} from "../../../../data/models/persistenceModels/PostofficeBranchServices";
import {
	IPostofficeUpdateErrorBuilder,
	PostofficeUpdateErrorBuilder,
} from "../../../../data/models/persistenceModels/UpdateErrorRecord";
import { IPostofficeBranchesRepository } from "../../../../data/repositories/PostofficeBranchesRepository";
import { IUpdateErrorRecordsRepository } from "../../../../data/repositories/UpdateErrorRecordsRepository";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";
import {
	IRequestTracker,
	RequestTrackerReason,
} from "../consumptionTracker/RequestTracker";
import {
	CreateUserNode,
	IPostofficeRequestNode,
} from "./PostofficeRequestNodes";

export interface IConstructServicesRecord {
	constructRecord(args: {
		serviceIdAndQnomycode: IBranchIdQnomyCodePair;
		endpointProxyString?: string;
	}): Promise<{
		status: RequestTrackerReason;
		servicesBuilder: IPostofficeBranchServicesBuilder;
		errorsBuilder: IPostofficeUpdateErrorBuilder;
	}>;

	continuePausedConstruction(args: { endpointProxyString?: string }): Promise<{
		status: RequestTrackerReason | "empty queue";
		currentIdQnomycode: IBranchIdQnomyCodePair | undefined;
		servicesBuilder: IPostofficeBranchServicesBuilder;
		errorsBuilder: IPostofficeUpdateErrorBuilder;
	}>;
}

export class ConstructServicesRecord implements IConstructServicesRecord {
	private requestNodesQueue: IPostofficeRequestNode[];
	private buildErrors: IPostofficeUpdateErrorBuilder;
	private buildServices: IPostofficeBranchServicesBuilder;
	private requestTracker: IRequestTracker;
	private serviceIdAndQnomycode: IBranchIdQnomyCodePair | undefined;
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor(setupArguments: {
		branchesRepository: IPostofficeBranchesRepository;
		errorRepository: IUpdateErrorRecordsRepository;
		requestTracker: IRequestTracker;
	}) {
		this.pathStack = new PathStack().push("Construct Services record");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
		this.requestTracker = setupArguments.requestTracker;
		this.requestNodesQueue = [];
		this.buildErrors = new PostofficeUpdateErrorBuilder();
		this.buildServices = new PostofficeBranchServicesBuilder();
	}

	async constructRecord(args: {
		serviceIdAndQnomycode: IBranchIdQnomyCodePair;
		endpointProxyString?: string;
	}): Promise<{
		status: RequestTrackerReason;
		servicesBuilder: IPostofficeBranchServicesBuilder;
		errorsBuilder: IPostofficeUpdateErrorBuilder;
	}> {
		this.serviceIdAndQnomycode = args.serviceIdAndQnomycode;
		this.setupQueue(args);
		const response = await this.runBfs();
		return {
			status: response,
			servicesBuilder: this.buildServices,
			errorsBuilder: this.buildErrors,
		};
	}

	async continuePausedConstruction(args: {
		endpointProxyString?: string;
	}): Promise<{
		status: RequestTrackerReason | "empty queue";
		currentIdQnomycode: IBranchIdQnomyCodePair | undefined;
		servicesBuilder: IPostofficeBranchServicesBuilder;
		errorsBuilder: IPostofficeUpdateErrorBuilder;
	}> {
		if (this.requestNodesQueue.length == 0) {
			return {
				status: "empty queue",
				currentIdQnomycode: this.serviceIdAndQnomycode,
				servicesBuilder: this.buildServices,
				errorsBuilder: this.buildErrors,
			};
		}
		const response = await this.runBfs();
		return {
			status: response,
			currentIdQnomycode: this.serviceIdAndQnomycode,
			servicesBuilder: this.buildServices,
			errorsBuilder: this.buildErrors,
		};
	}

	private setupQueue(args: {
		overwrite?: boolean;
		serviceIdAndQnomycode: IBranchIdQnomyCodePair;
		endpointProxyString?: string;
	}): void {
		this.pathStack.push("Setup queue");
		try {
			const queueHasItems = this.requestNodesQueue.length > 0 ? true : false;
			// If overwrite isn't truthful, while queue has items, setup can't be performed.
			if (args.overwrite) this.requestNodesQueue = [];
			else if (queueHasItems)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Internal,
					message: "Queue is full, cannot reset without data loss",
					details: {
						remainingRequests: this.requestNodesQueue.length,
					},
				});
			this.requestNodesQueue.push(
				new CreateUserNode({
					servicesModelBuilder: this.buildServices,
					errorModelBuilder: this.buildErrors,
					qnomyCodeLocationId:
						String(args.serviceIdAndQnomycode.qnomycode) ?? "",
					endpointProxyString: args.endpointProxyString,
				})
			);
		} finally {
			this.pathStack.pop();
		}
	}

	private async runBfs(): Promise<RequestTrackerReason> {
		while (this.requestNodesQueue.length) {
			const parentNode = this.requestNodesQueue.pop();
			if (!parentNode) break;
			const { authorized, reason } = this.requestTracker.trackRequest();
			if (!authorized) {
				this.requestNodesQueue.unshift(parentNode);
				return reason; // overflow or above-limit (equals to depleted).
			}
			const childNodes = await parentNode.performRequest();
			for (let index = childNodes.length - 1; index > -1; index--) {
				this.requestNodesQueue.push(childNodes[index]);
			}
		}
		return "OK";
	}
}
