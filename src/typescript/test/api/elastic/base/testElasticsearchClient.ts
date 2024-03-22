import { ElasticsearchClient } from '../../../../api/elastic/base/ElasticsearchClient';
import { branchIndexName } from '../../../../shared/constants/indices/BranchIndex';
import { testIndexMapping, testIndexName } from '../../../../shared/constants/indices/TestIndex';

console.log('** testElasticsearchClient **');

export const getInstance = async () => {
	console.log('** (1) ElasticsearchClient.getInstance **');
	const eClient = ElasticsearchClient.getInstance();
	if (!eClient) throw '[getInstance] Test Failed, ElasticsearchClient is null  undefined';
	else console.log('[getInstance] ElasticsearchClient is not null / undefined');
	return eClient;
};

export const positivePingIndex = async () => {
	console.log('** (2) ElasticsearchClient.pingIndex - Positive **');
	const eClient = await getInstance();
	const response = await eClient.pingIndex({ indexName: branchIndexName });
	console.log('[pingIndex][Positive] : ', response);
};

export const negativePingIndex = async () => {
	console.log('** (2) ElasticsearchClient.pingIndex - Negative **');
	const eClient = await getInstance();
	const response = await eClient.pingIndex({ indexName: 'derpo-derp' });
	console.log('[pingIndex][Negative] : ', response);
};

export const getIndexMapping = async () => {
	console.log('** (3) ElasticsearchClient.getIndexMapping **');
	const eClient = await getInstance();
	const response = await eClient.getIndexMapping({ indexName: branchIndexName });
	console.log('[getIndexMapping] : ', response);
};

export const createIndex = async () => {
	console.log('** (4) ElasticsearchClient.createIndex **');
	const eClient = await getInstance();
	const response = await eClient.createIndex({
		indexName: testIndexName,
		indexMapping: testIndexMapping,
	});
	console.log('[createIndex] : ', response);
};
