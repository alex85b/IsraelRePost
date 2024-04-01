import * as dotenv from 'dotenv';
import { IBranchQnomycodePair } from '../../elastic/branchServices/BranchServicesIndexing';

const MODULE_NAME = 'Redis Cloud Utilities';

export const getRedisCloudData = () => {
	dotenv.config();

	const host = process.env['REDS_HST'] ?? '';
	const port = Number.parseInt(process.env['REDS_PRT'] ?? '-1');
	const password = process.env['REDS_PSS'] ?? '';

	const errorArray: string[] = [];
	if (host === '') {
		errorArray.push('Failed to read RedisCloud host');
	}
	if (password === '') {
		errorArray.push('Failed to read RedisCloud password');
	}
	if (port === -1) {
		errorArray.push('Failed to read RedisCloud port');
	}

	if (errorArray.length) {
		throw Error(`[${MODULE_NAME}][getRedisCloudData] Errors : ` + errorArray.join('; '));
	}

	const redisData = {
		host,
		port,
		password,
	};

	return redisData;
};

export const deserializeItems = (data: { serializedItems: string[] }) => {
	if (!Array.isArray(data.serializedItems)) return null;
	let deserialized: IBranchQnomycodePair[] = [];
	try {
		deserialized = data.serializedItems.map((item) => JSON.parse(item));
	} catch (error) {
		console.error(`[${MODULE_NAME}][deserializeItems] Error : ` + error);
	}
	return deserialized;
};
