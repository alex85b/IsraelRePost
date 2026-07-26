import {
	IRedisQueueClient,
	RedisQueueClient,
} from "../../api/redisCloud/base/RedisQueueClient";
import { ServiceError, ErrorSource } from "../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../shared/classes/WinstonClient";
import {
	IBranchIdQnomyCodePair,
	IPostofficeBranchIdCodePairBuilder,
	PostofficeBranchIdCodePairBuilder,
	deserializeBranchIdCodePairs,
} from "../models/persistenceModels/PostofficeBranchIdCodePair";

export interface IPostofficeCodeIdPairsRepository {
	popAllPairs(): Promise<{
		processed: IBranchIdQnomyCodePair[];
		unprocessed: IBranchIdQnomyCodePair[];
	}>;
	popUnprocessedPair(): Promise<IBranchIdQnomyCodePair | null>;
	pushProcessedPair(
		idCodePair: IBranchIdQnomyCodePair
	): Promise<{ itemsInQueue: number }>;
	replaceUnprocessedQueue(
		idCodePairs: IBranchIdQnomyCodePair[]
	): Promise<{ itemsInQueue: number; replacedAmount: number }>;
	dropProcessedQueue(): Promise<{ droppedAmount: number }>;
	disconnect(): Promise<void>;
}

export class PostofficeCodeIdPairsRepository
	implements IPostofficeCodeIdPairsRepository
{
	private queue: IRedisQueueClient;
	private unprocessedQName: string;
	private processedQName: string;
	private modelBuilder: IPostofficeBranchIdCodePairBuilder;
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor() {
		this.queue = RedisQueueClient.getInstance();
		this.unprocessedQName = "unprocessed";
		this.processedQName = "processed";
		this.modelBuilder = new PostofficeBranchIdCodePairBuilder();
		this.pathStack = new PathStack().push("PostofficeCodeIdPairsRepository");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	async popAllPairs(): Promise<{
		processed: IBranchIdQnomyCodePair[];
		unprocessed: IBranchIdQnomyCodePair[];
	}> {
		const processed = await this.queue.bDequeueAll({
			queueName: this.processedQName,
		});
		const unprocessed = await this.queue.bDequeueAll({
			queueName: this.unprocessedQName,
		});

		this.logger.logInfo({
			message: "content of processed-queue",
			details: processed,
		});

		this.logger.logInfo({
			message: "content of unprocessed-queue",
			details: unprocessed,
		});

		return {
			processed: deserializeBranchIdCodePairs({
				serializedCodeIdPair: processed ?? [],
			}),
			unprocessed: deserializeBranchIdCodePairs({
				serializedCodeIdPair: unprocessed ?? [],
			}),
		};
	}

	async popUnprocessedPair(): Promise<IBranchIdQnomyCodePair | null> {
		const serialized = await this.queue.dequeue({
			queueName: this.unprocessedQName,
		});
		if (!serialized) return null;
		return this.modelBuilder
			.useStringedJson({ serializedItems: serialized })
			.build();
	}

	async pushProcessedPair(
		idCodePair: IBranchIdQnomyCodePair
	): Promise<{ itemsInQueue: number }> {
		return {
			itemsInQueue: await this.queue.enqueue({
				data: idCodePair,
				queueName: this.processedQName,
			}),
		};
	}

	async replaceUnprocessedQueue(
		idCodePairs: IBranchIdQnomyCodePair[]
	): Promise<{ itemsInQueue: number; replacedAmount: number }> {
		const replacedAmount = (
			await this.queue.bDequeueAll({ queueName: this.unprocessedQName })
		).length;
		const itemsInQueue = await this.queue.bEnqueue({
			itemsToEnqueue: idCodePairs,
			queueName: this.unprocessedQName,
		});
		return {
			itemsInQueue,
			replacedAmount,
		};
	}

	async dropProcessedQueue(): Promise<{
		droppedAmount: number;
	}> {
		return {
			droppedAmount: (
				await this.queue.bDequeueAll({ queueName: this.processedQName })
			).length,
		};
	}

	async disconnect(): Promise<void> {
		const ok = await this.queue.disconnect();
		if (ok !== "OK")
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Disconnect response is invalid",
				details: {
					response: ok,
				},
			});
	}
}
