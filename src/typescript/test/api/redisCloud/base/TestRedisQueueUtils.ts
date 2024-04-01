import {
	getRedisCloudData as fetchData,
	deserializeItems as deserialize,
} from '../../../../api/redisCloud/base/RedisQueueUtils';

console.log('** Test Redis Queue Utilities **');

export const getRedisCloudData = () => {
	console.log('** (1) getRedisCloudData **');
	const data = fetchData();
	console.log(`[getRedisCloudData] data keys : `, Object.keys(data));
};

export const deserializeItems = () => {
	console.log('** (2) deserializeItems **');
	const container: string[] = [];
	container.push(JSON.stringify({ key: 'value' }));
	container.push('qwep!');
	console.log(`[deserializeItems] Serialized items : `, container);
	const data = deserialize({ serializedItems: container });
	console.log(`[deserializeItems] De serialized items : `, data);
};
