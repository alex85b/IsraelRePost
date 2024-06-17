import { IRedisQueueClient, RedisQueueClient } from '../../api/redisCloud/base/RedisQueueClient';
import {
	IBranchIdQnomyCodePair,
	IPostofficeBranchIdCodePairBuilder,
	PostofficeBranchIdCodePairBuilder,
	deserializeBranchIdCodePairs,
} from '../models/persistenceModels/PostofficeBranchIdCodePair';

export interface IPostofficeCodeIdPairsRepository {
	popAllPairs(): Promise<{
		processed: IBranchIdQnomyCodePair[];
		unprocessed: IBranchIdQnomyCodePair[];
	}>;
	popUnprocessedPair(): Promise<IBranchIdQnomyCodePair | null>;
	pushProcessedPair(idCodePair: IBranchIdQnomyCodePair): Promise<{ itemsInQueue: number }>;
	replaceUnprocessedQueue(
		idCodePairs: IBranchIdQnomyCodePair[]
	): Promise<{ itemsInQueue: number; replacedAmount: number }>;
	dropProcessedQueue(): Promise<{ droppedAmount: number }>;
	disconnect(): Promise<void>;
}

export class PostofficeCodeIdPairsRepository implements IPostofficeCodeIdPairsRepository {
	private queue: IRedisQueueClient;
	private unprocessedQName: string;
	private processedQName: string;
	private modelBuilder: IPostofficeBranchIdCodePairBuilder;

	constructor() {
		this.queue = RedisQueueClient.getInstance();
		this.unprocessedQName = 'unprocessed';
		this.processedQName = 'processed';
		this.modelBuilder = new PostofficeBranchIdCodePairBuilder();
	}

	async popAllPairs(): Promise<{
		processed: IBranchIdQnomyCodePair[];
		unprocessed: IBranchIdQnomyCodePair[];
	}> {
		return {
			processed: deserializeBranchIdCodePairs({
				serializedCodeIdPair: await this.queue.bDequeueAll({
					queueName: this.processedQName,
				}),
			}),
			unprocessed: deserializeBranchIdCodePairs({
				serializedCodeIdPair: await this.queue.bDequeueAll({
					queueName: this.unprocessedQName,
				}),
			}),
		};
	}

	async popUnprocessedPair(): Promise<IBranchIdQnomyCodePair | null> {
		const serialized = await this.queue.dequeue({ queueName: this.unprocessedQName });
		if (!serialized) return null;
		return this.modelBuilder.useStringedJson({ serializedItems: serialized }).build();
	}

	async pushProcessedPair(idCodePair: IBranchIdQnomyCodePair): Promise<{ itemsInQueue: number }> {
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
		const replacedAmount = (await this.queue.bDequeueAll({ queueName: this.unprocessedQName }))
			.length;
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
			droppedAmount: (await this.queue.bDequeueAll({ queueName: this.processedQName }))
				.length,
		};
	}

	async disconnect(): Promise<void> {
		const ok = await this.queue.disconnect();
		if (ok !== 'OK')
			throw Error(
				'[PostofficeCodeIdPairsRepository][disconnect] Erroneous response : ' +
					JSON.stringify(ok)
			);
	}
}
