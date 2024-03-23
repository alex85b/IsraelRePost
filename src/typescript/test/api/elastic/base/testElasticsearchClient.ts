import { ElasticsearchClient } from '../../../../api/elastic/base/ElasticsearchClient';
import { BRANCH_INDEX_NAME } from '../../../../shared/constants/elasticIndices/branch/Index';
import { TEST_INDEX_MAPPING } from '../../../../shared/constants/elasticIndices/testIndex/Mapping';
import { TEST_INDEX_NAME } from '../../../../shared/constants/elasticIndices/testIndex/Index';

console.log('** Test Elasticsearch Client **');

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
	const response = await eClient.pingIndex({ indexName: BRANCH_INDEX_NAME });
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
	const response = await eClient.getIndexMapping({ indexName: BRANCH_INDEX_NAME });
	console.log('[getIndexMapping] : ', response);
};

export const createIndex = async () => {
	console.log('** (4) ElasticsearchClient.createIndex **');
	const eClient = await getInstance();
	const response = await eClient.createIndex({
		indexName: TEST_INDEX_NAME,
		indexMapping: TEST_INDEX_MAPPING,
	});
	console.log('[createIndex] : ', response);
};
