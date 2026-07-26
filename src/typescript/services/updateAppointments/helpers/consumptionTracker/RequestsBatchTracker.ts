import { IRequestsPool } from "../../../../data/models/dataTransferModels/Updatable";
import { isValidNumber } from "../../../../data/models/shared/FieldValidation";
import { ServiceError, ErrorSource } from "../../../../errors/ServiceError";
import {
	ISynchronizedCountDown,
	MutexCounter,
} from "../concurrency/SynchronizedWriter";
import { IPathTracker, PathStack } from "../../../../shared/classes/PathStack";
import {
	ILogger,
	WinstonClient,
} from "../../../../shared/classes/WinstonClient";

export interface IRequestsBatchTracker {
	trackRequestBatch({ batchSize }: { batchSize: number }): Promise<{
		authorized: boolean;
		allowedBatchSize: number;
		requestsLeft: number;
	}>;
}

export interface IRequestsBatchTrackerBuilder {
	useUpdatableAndMutex(updatable?: IRequestsPool): this;
	useSynchronizedCountDown(
		synchronizationMechanism?: ISynchronizedCountDown
	): this;
	build(): IRequestsBatchTracker;
}

export class RequestsBatchTrackerBuilder
	implements IRequestsBatchTrackerBuilder
{
	private synchronizationMechanism: ISynchronizedCountDown | undefined;
	private faults: string[];
	private logger: ILogger;
	private pathStack: IPathTracker;

	private requestsBatchTracker = class RequestsBatchTracker
		implements IRequestsBatchTracker
	{
		private synchronization: ISynchronizedCountDown;

		constructor(buildData: {
			SynchronizationMechanism: ISynchronizedCountDown;
		}) {
			this.synchronization = buildData.SynchronizationMechanism;
		}

		async trackRequestBatch({ batchSize }: { batchSize: number }): Promise<{
			authorized: boolean;
			requestsLeft: number;
			allowedBatchSize: number;
		}> {
			const requestsLeft = await this.synchronization.subtract(batchSize);
			const allowedBatchSize =
				batchSize - Math.abs(requestsLeft) > 0
					? batchSize - Math.abs(requestsLeft)
					: 0;
			if (requestsLeft < 0) {
				return {
					authorized: false,
					requestsLeft: requestsLeft,
					allowedBatchSize,
				};
			}
			return { authorized: true, requestsLeft, allowedBatchSize: requestsLeft };
		}
	};

	constructor() {
		this.faults = [];
		this.pathStack = new PathStack().push("Requests Batch tracker Builder");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	useUpdatableAndMutex(updatable: IRequestsPool) {
		try {
			if (updatable) {
				const { read, updateTarget, write } = updatable;
				if (!isValidNumber(updateTarget))
					this.faults.push("updatable is invalid: updateTarget is nan");
				if (typeof read !== "function") {
					this.faults.push("updatable is invalid: read is not a function");
				}
				if (typeof write !== "function") {
					this.faults.push("updatable is invalid: write is not a function");
				}
				this.synchronizationMechanism = this.synchronizationMechanism =
					new MutexCounter(updatable);
			} else this.faults.push("updatable has not been provided");
		} finally {
			return this;
		}
	}

	useSynchronizedCountDown(synchronizationMechanism: ISynchronizedCountDown) {
		if (synchronizationMechanism) {
			const { read, subtract } = synchronizationMechanism;
			if (typeof read !== "function") {
				this.faults.push(
					"synchronizationMechanism is invalid read is not a function"
				);
			}
			if (typeof subtract !== "function") {
				this.faults.push(
					"synchronizationMechanism is invalid subtract is not a function"
				);
			}
			this.synchronizationMechanism = synchronizationMechanism;
			return this;
		} else this.faults.push("synchronizationMechanism has not been provided");

		this.synchronizationMechanism = synchronizationMechanism;
		return this;
	}

	build() {
		try {
			if (!this.synchronizationMechanism)
				this.faults.push("failed to setup synchronizationMechanism");
			if (this.faults.length)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Internal,
					message: "Request track Build arguments are invalid",
					details: {
						faults: this.faults.join(" | "),
					},
				});
			return new this.requestsBatchTracker({
				SynchronizationMechanism: this
					.synchronizationMechanism as ISynchronizedCountDown,
			});
		} finally {
			this.faults = [];
			this.synchronizationMechanism = undefined;
		}
	}
}

export interface IMutexBatchTrackerBuilder {
	(totalRequests: number): IRequestsBatchTracker;
}

export const buildMutexRequestsBatchTracker: IMutexBatchTrackerBuilder = (
	totalRequests: number
): IRequestsBatchTracker => {
	const pathStack: IPathTracker = new PathStack().push(
		"Build Mutex requests Batch tracker"
	);
	const logger: ILogger = new WinstonClient({ pathStack });

	if (!isValidNumber(totalRequests))
		throw new ServiceError({
			logger: logger,
			source: ErrorSource.Internal,
			message: "Total requests is NAN",
			details: {
				totalRequests,
			},
		});
	const requestPool = {
		updateTarget: totalRequests,
		read: () => requestPool.updateTarget,
		write: (update: number) => {
			requestPool.updateTarget = update;
			return update;
		},
	};
	const builder: IRequestsBatchTrackerBuilder =
		new RequestsBatchTrackerBuilder().useUpdatableAndMutex(requestPool);
	return builder.build();
};
