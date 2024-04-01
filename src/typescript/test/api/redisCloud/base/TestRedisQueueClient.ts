import { RedisQueueClient } from '../../../../api/redisCloud/base/RedisQueueClient';

console.log('** Test Redis Queue Client **');

export const construct = () => {
	console.log('** (1) RedisQueueClient.getInstance **');
	const redisQueue = RedisQueueClient.getInstance();
	if (!redisQueue)
		throw Error('[construct] Test Failed, BranchServicesIndexing is null Or undefined');
	else console.log('[construct] BranchServicesIndexing is not null / undefined');
	return redisQueue;
};

export const enqueue = async () => {
	console.log('** (2) RedisQueueClient.enqueue **');
	const redisQueue = construct();
	const enqueueTestA = { dataName: 'test-data-a', payload: '123' };
	console.log('[enqueue] enqueue data, enqueueTestA : ', enqueueTestA);

	const enqueueTestB = { dataName: 'test-data-b', payload: '456' };
	console.log('[enqueue] enqueue data, enqueueTestB : ', enqueueTestB);

	let enqueuedCount = await redisQueue.enqueue({ queueName: 'testQueue', data: enqueueTestA });
	console.log('[enqueue] redisQueue.enqueue enqueueTestA response : ', enqueuedCount);
	if (enqueuedCount === 0)
		throw Error('[enqueue] Test Failed, redisQueue.enqueue enqueueTestA : 0');

	enqueuedCount = await redisQueue.enqueue({ queueName: 'testQueue', data: enqueueTestB });
	console.log('[enqueue] redisQueue.enqueue enqueueTestB response : ', enqueuedCount);
	if (enqueuedCount === 0)
		throw Error('[enqueue] Test Failed, redisQueue.enqueue enqueueTestA : 0');

	console.log('[enqueue] disconnected : ', await redisQueue.disconnect());
};

export const dequeue = async () => {
	console.log('** (3) RedisQueueClient.dequeue **');
	const redisQueue = construct();

	let dequeued = await redisQueue.dequeue({ queueName: 'testQueue' });
	console.log('[dequeue] redisQueue.dequeued : ', dequeued);

	dequeued = await redisQueue.dequeue({ queueName: 'testQueue' });
	console.log('[dequeue] redisQueue.dequeued : ', dequeued);

	dequeued = await redisQueue.dequeue({ queueName: 'testQueue' });
	console.log('[dequeue] redisQueue.dequeued : ', dequeued);

	console.log('[dequeue] disconnected : ', await redisQueue.disconnect());
};

export const exists = async () => {
	console.log('** (4) RedisQueueClient.exists **');
	const redisQueue = construct();

	let count = await redisQueue.exists({ queueName: 'qwe' });
	console.log('[exists] exists queueName qwe : ', count);

	count = await redisQueue.exists({ queueName: 'testQueue' });
	console.log('[exists] exists queueName testQueue : ', count);

	console.log('[exists] disconnected : ', await redisQueue.disconnect());
};

export const bEnqueue = async () => {
	console.log('** (5) RedisQueueClient.bEnqueue **');
	const redisQueue = construct();

	const container: any[] = [];

	const enqueueTestC = { dataName: 'test-data-c', payload: '789' };
	container.push(enqueueTestC);
	console.log('[bEnqueue] enqueue data, enqueueTestC : ', enqueueTestC);

	const enqueueTestD = { dataName: 'test-data-d', payload: 'A12' };
	container.push(enqueueTestD);
	console.log('[bEnqueue] enqueue data, enqueueTestD : ', enqueueTestD);

	let enqueuedCount = await redisQueue.bEnqueue({
		queueName: 'testQueue',
		itemsToEnqueue: container,
	});
	console.log('[bEnqueue] enqueuedCount : ', enqueuedCount);

	console.log('[bEnqueue] disconnected : ', await redisQueue.disconnect());
};

export const bDequeueAll = async () => {
	console.log('** (6) RedisQueueClient.bDequeueAll **');
	const redisQueue = construct();

	let dequeueBulk = await redisQueue.bDequeueAll({
		queueName: 'testQueue',
	});

	if (!Array.isArray(dequeueBulk)) {
		throw Error('[bDequeueAll] Test Failed, dequeueBulk is not an array');
	}

	console.log('[bDequeueAll] dequeueBulk : ', dequeueBulk);
	console.log('[bDequeueAll] disconnected : ', await redisQueue.disconnect());
};

export const qSize = async () => {
	console.log('** (7) RedisQueueClient.qSize **');
	const redisQueue = construct();

	console.log('[qSize] Empty Queue from content');
	await redisQueue.bDequeueAll({
		queueName: 'testQueue',
	});
	console.log(
		'[qSize] Queue Size after emptying : ',
		await redisQueue.qSize({ queueName: 'testQueue' })
	);
	console.log('[qSize] Input single Queue-item');
	redisQueue.enqueue({
		queueName: 'testQueue',
		data: { dataName: 'Queue-item', payload: 'Q' },
	});
	console.log(
		'[qSize] Queue Size after emptying : ',
		await redisQueue.qSize({ queueName: 'testQueue' })
	);
	console.log('[bEnqueue] disconnected : ', await redisQueue.disconnect());
};
