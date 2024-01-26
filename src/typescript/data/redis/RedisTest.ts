// Import the Redis library and the function for generating random characters
import Redis from 'ioredis';
import { generateRandomChars } from '../../common/SimpleRandomChars';
import * as dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

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
console.log('Redis setup: ', data);

const redis = new Redis(data);

// Define the name of the queue
const queueName = 'updateNormal';

// Enqueue function to push a randomly generated value to the Redis list
const enqueue = async () => {
	// Generate a random string of 4 characters
	const randomValue = generateRandomChars(4);
	// Push the generated value with a prefix to the queue
	return await redis.lpush(queueName, 'value_' + randomValue);
};

// Dequeue function to retrieve an item from the Redis list
const dequeue = async () => await redis.rpop(queueName);

// Bulk dequeue function to enqueue an array of items
const bEnqueue = async () => {
	const itemsToEnqueue = [
		'value_' + generateRandomChars(4),
		'value_' + generateRandomChars(4),
		'value_' + generateRandomChars(4),
		'value_' + generateRandomChars(4),
	];
	await redis.lpush(queueName, ...itemsToEnqueue);
};

// Returns the size of the Redis queue
const queueSize = async () => {
	return await redis.llen(queueName);
};

// Export the enqueue, dequeue, bulk enqueue functions, queue size, and queue name for use in other modules
export { enqueue, dequeue, bEnqueue, queueSize, queueName };
