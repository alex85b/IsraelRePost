import { ElasticClient } from '../elastic/elstClient';

export const SetUpElasticClient = async (
	resetIndex: 'branches' | 'slots' | 'none',
	certificates: string
) => {
	const elasticClient = new ElasticClient({
		caCertificate: certificates,
		password: process.env.ELS_PSS || '',
		rejectUnauthorized: false,
		username: 'elastic',
		node: 'https://127.0.0.1:9200',
	});

	elasticClient.sendPing();

	if (resetIndex !== 'none') {
		if (await elasticClient.indexExists(resetIndex)) {
			await elasticClient.deleteIndices(resetIndex);
			await elasticClient.setupIndex(resetIndex);
		} else await elasticClient.setupIndex(resetIndex);
	}

	return elasticClient;
};
