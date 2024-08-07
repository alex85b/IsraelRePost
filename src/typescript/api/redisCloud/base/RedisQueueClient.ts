import Redis from 'ioredis';
import { getRedisCloudData } from './RedisQueueUtils';

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IRedisQueueClient {
	exists(requestData: { queueName: string }): Promise<number>;

	enqueue(requestData: { queueName: string; data: any }): Promise<number>;

	dequeue(requestData: { queueName: string }): Promise<string | null>;

	bEnqueue(requestData: { queueName: string; itemsToEnqueue: any[] }): Promise<number>;

	bDequeueAll(requestData: { queueName: string }): Promise<string[]>;

	qSize(requestData: { queueName: string }): Promise<number>;

	disconnect(): Promise<'OK'>;
}

// ###################################################################################################
// ### RedisQueueClient Class ########################################################################
// ###################################################################################################

export class RedisQueueClient implements IRedisQueueClient {
	private static instance: RedisQueueClient;
	private redis: Redis;

	private constructor() {
		this.redis = new Redis(getRedisCloudData());
	}

	public static getInstance(): RedisQueueClient {
		if (!RedisQueueClient.instance) {
			RedisQueueClient.instance = new RedisQueueClient();
		}
		return RedisQueueClient.instance;
	}

	public async exists(requestData: { queueName: string }) {
		return await this.redis.exists(requestData.queueName);
	}

	public async enqueue(requestData: { queueName: string; data: any }) {
		return await this.redis.rpush(requestData.queueName, JSON.stringify(requestData.data));
	}

	public async dequeue(requestData: { queueName: string }) {
		return await this.redis.lpop(requestData.queueName);
	}

	public async bEnqueue(requestData: { queueName: string; itemsToEnqueue: any[] }) {
		const serializedItems = requestData.itemsToEnqueue.map((item) => JSON.stringify(item));
		return await this.redis.rpush(requestData.queueName, ...serializedItems);
	}

	public async bDequeueAll(requestData: { queueName: string }) {
		const dequeuedItems = await this.redis.lrange(requestData.queueName, 0, -1);
		await this.redis.ltrim(requestData.queueName, 1, 0);
		return dequeuedItems ?? [];
	}

	public async qSize(requestData: { queueName: string }) {
		return await this.redis.llen(requestData.queueName);
	}

	public async disconnect() {
		return await this.redis.quit();
	}
}
