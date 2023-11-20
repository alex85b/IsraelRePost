import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { IBranchQnomycodePair } from '../elastic/BranchModel';

dotenv.config();

export abstract class BaseRedisQueue {
	protected redis: Redis;
	protected abstract queueName: string;

	constructor() {
		// Create a new Redis instance with the provided Redis Cloud configuration
		const data = {
			// Redis Cloud hostname or IP.
			host: process.env['REDS_HST'],
			// Redis port.
			port: Number.parseInt(process.env['REDS_PRT'] ?? '0'), // Default port set to 0 if not specified
			// Redis Cloud password or authentication credentials.
			password: process.env['REDS_PSS'],
		};

		// Log the Redis configuration data
		// console.log('[BaseRedis][constructor] Redis setup: ', data);

		this.redis = new Redis(data);
	}

	protected async enqueue(data: any) {
		return await this.redis.rpush(this.queueName, JSON.stringify(data));
	}

	protected async dequeue() {
		const serializedItem = await this.redis.lpop(this.queueName);
		if (!serializedItem) return null;
		const deserializedItem: IBranchQnomycodePair = JSON.parse(serializedItem);
		return deserializedItem;
	}

	protected async bEnqueue(itemsToEnqueue: any[]) {
		const serializedItems = itemsToEnqueue.map((item) => JSON.stringify(item));
		return await this.redis.rpush(this.queueName, ...serializedItems);
	}

	protected async bDequeueAll() {
		const dequeuedItems = await this.redis.lrange(this.queueName, 0, -1);
		await this.redis.ltrim(this.queueName, 1, 0);
		const deserializedItems: IBranchQnomycodePair[] = dequeuedItems.map((item) =>
			JSON.parse(item)
		);
		return deserializedItems;
	}

	protected async qSize() {
		return await this.redis.llen(this.queueName);
	}
}
