import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';

export const SetUpElasticClient = async (
	resetIndex: 'branches' | 'slots' | 'none',
	certificates: string
) => {
	// const certificatePath = path.join(
	// 	__dirname,
	// 	'..',
	// 	'..',
	// 	'elastic-cert',
	// 	'http_ca.crt'
	// );

	const elasticClient = new ElasticClient(
		'https://127.0.0.1:9200',
		'elastic',
		process.env.ELS_PSS || '',
		certificates,
		false
	);

	elasticClient.sendPing();

	if (resetIndex !== 'none') {
		if (await elasticClient.indexExists(resetIndex)) {
			await elasticClient.deleteIndices(resetIndex);
			await elasticClient.setupIndex(resetIndex);
		} else await elasticClient.setupIndex(resetIndex);
	}

	return elasticClient;
};
