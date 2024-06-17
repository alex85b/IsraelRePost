// import Redis from 'ioredis';
// import * as dotenv from 'dotenv';
// import { IBranchQnomycodePair } from '../elastic/BranchModel';

// export abstract class BaseRedisQueue {
// 	protected redis: Redis;
// 	protected abstract queueName: string;
// 	private initialized: boolean = false;

// 	constructor() {
// 		dotenv.config();
// 		// Create a new Redis instance with the provided Redis Cloud configuration
// 		const data = {
// 			// Redis Cloud hostname or IP.
// 			host: process.env['REDS_HST'],
// 			// Redis port.
// 			port: Number.parseInt(process.env['REDS_PRT'] ?? '0'), // Default port set to 0 if not specified
// 			// Redis Cloud password or authentication credentials.
// 			password: process.env['REDS_PSS'],
// 		};

// 		// Log the Redis configuration data
// 		// console.log('[BaseRedis][constructor] Redis setup: ', data);

// 		this.redis = new Redis(data);
// 	}

// 	protected async exists() {
// 		return await this.redis.exists(this.queueName);
// 	}

// 	private async init() {
// 		if (!(await this.exists())) {
// 			await this.redis.rpush(this.queueName, 'Init');
// 			const dequeue = await this.redis.lpop(this.queueName);
// 			if (dequeue != 'Init') {
// 				throw Error(
// 					`[Base Redis Queue :${this.queueName}][init] queue does not exist and initialization has failed`
// 				);
// 			}
// 		}
// 	}

// 	protected async enqueue(data: any) {
// 		return await this.redis.rpush(this.queueName, JSON.stringify(data));
// 	}

// 	protected async dequeue() {
// 		// if (!this.initialized) await this.init();
// 		const serializedItem = await this.redis.lpop(this.queueName);
// 		if (!serializedItem) return null;
// 		const deserializedItem: IBranchQnomycodePair = JSON.parse(serializedItem);
// 		return deserializedItem;
// 	}

// 	protected async bEnqueue(itemsToEnqueue: any[]) {
// 		const serializedItems = itemsToEnqueue.map((item) => JSON.stringify(item));
// 		return await this.redis.rpush(this.queueName, ...serializedItems);
// 	}

// 	protected async bDequeueAll() {
// 		if (!this.initialized) await this.init();
// 		const dequeuedItems = await this.redis.lrange(this.queueName, 0, -1);
// 		await this.redis.ltrim(this.queueName, 1, 0);
// 		const deserializedItems: IBranchQnomycodePair[] = dequeuedItems.map((item) =>
// 			JSON.parse(item)
// 		);
// 		return deserializedItems;
// 	}

// 	protected async qSize() {
// 		if (!this.initialized) await this.init();
// 		return await this.redis.llen(this.queueName);
// 	}
// }
