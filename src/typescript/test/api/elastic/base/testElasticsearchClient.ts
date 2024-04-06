import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { ElasticsearchClient } from '../../../../api/elastic/base/ElasticsearchClient';
import { BRANCH_INDEX_NAME } from '../../../../api/elastic/branchServices/constants/Index';
import { buildAllRecordsQuery } from '../../../../api/elastic/shared/queryBuilders/QueryAllRecordsBuilder';
import { buildDeleteRecordQuery } from '../../../../api/elastic/shared/queryBuilders/DeleteByQueryBuilder';
import { updateBranchServicesRequest } from '../../../../api/elastic/branchServices/requests/UpdateBranchServicesRequest';

console.log('** Test Elasticsearch Client **');

const TEST_INDEX_NAME: string = 'test';
const TEST_INDEX_MAPPING: MappingTypeMapping = {
	dynamic: 'strict',
	properties: {
		id: { type: 'integer' },
		field1: { type: 'text' },
		services: {
			type: 'nested',
			properties: {
				field1_1: { type: 'keyword' },
				field1_2: { type: 'text' },
			},
		},
	},
};

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
	const response = await eClient.getIndexMapping({ indexName: TEST_INDEX_NAME });
	console.log('[getIndexMapping] : ', JSON.stringify(response));
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

export const searchIndex = async () => {
	console.log('** (5) ElasticsearchClient.searchIndex **');
	const eClient = await getInstance();
	const response = await eClient.searchIndex({
		indexName: TEST_INDEX_NAME,
		request: buildAllRecordsQuery({ maxRecords: 500 }),
	});
	console.log('[searchIndex] : ', JSON.stringify(response));
};

export const addUpdateRecord = async () => {
	console.log('** (6) ElasticsearchClient.addUpdateRecord **');
	const eClient = await getInstance();
	const exampleA = {
		id: 9999,
		field1: 'ExampleA',
		services: {
			field1_1: 'ExampleA_field1_1',
			field1_2: 'ExampleA_field1_2',
		},
	};
	const response = await eClient.addUpdateRecord({
		indexName: TEST_INDEX_NAME,
		documentId: 9999,
		record: exampleA,
	});
	console.log('[addUpdateRecord] : ', JSON.stringify(response));
};

export const deleteIndex = async () => {
	console.log('** (7) ElasticsearchClient.deleteIndex **');
	const eClient = await getInstance();
	const response = await eClient.deleteIndex({
		indexName: TEST_INDEX_NAME,
	});
	console.log('[deleteIndex] : ', response);
};

export const bulkAdd = async () => {
	console.log('** (8) ElasticsearchClient.bulkAdd **');
	const eClient = await getInstance();

	const container: IDocument[] = [];
	container.push({
		id: '9998',
		field1: 'ExampleZ',
		services: {
			field1_1: 'ExampleZ_field1_1',
			field1_2: 'ExampleZ_field1_2',
		},
	});
	container.push({
		id: '9997',
		field1: 'ExampleX',
		services: {
			field1_1: 'ExampleX_field1_1',
			field1_2: 'ExampleX_field1_2',
		},
	});

	const response = await eClient.bulkAdd({
		indexName: TEST_INDEX_NAME,
		bulkedDocuments: bulkDocuments({ indexName: TEST_INDEX_NAME, documentsArray: container }),
	});
	console.log('[addUpdateRecord] : ', JSON.stringify(response));
};

export const deleteRecordsByQ = async () => {
	console.log('** (9) ElasticsearchClient.deleteRecordsByQ **');
	const eClient = await getInstance();
	const response = await eClient.deleteRecordsByQ({
		indexName: TEST_INDEX_NAME,
		request: buildDeleteRecordQuery({ recordId: '9999' }),
	});
	console.log('[deleteRecordsByQ] : ', JSON.stringify(response));
};

export const updateRecordByQ = async () => {
	console.log('** (9) ElasticsearchClient.updateRecordByQ **');
	const eClient = await getInstance();
	const response = await eClient.updateRecordByQ({
		indexName: TEST_INDEX_NAME,
		request: updateBranchServicesRequest({
			branchID: '9999',
			params: { updatedServicesArray: [] },
		}),
	});
	console.log('[updateRecordByQ] : ', JSON.stringify(response));
};

/*
Helper Functions */
// ################
// ################

interface IDocument {
	[key: string]: string | { [key: string]: string };
	id: string;
}

const bulkDocuments = (bulkData: { indexName: string; documentsArray: IDocument[] }) => {
	// Initialize an empty array to store the bulk data
	let bulk: string[] = [];

	// Iterate over each branch document in the addBranches array
	bulkData.documentsArray.forEach((document) => {
		// Create the index metadata string for the current branch document
		const indexMetadata = JSON.stringify({
			index: {
				_index: bulkData.indexName,
				_id: document.id,
			},
		});

		// Convert document to a JSON string
		const stringedDocument = JSON.stringify(document);

		// Push the index metadata and branch document strings to the bulk array
		bulk.push(indexMetadata, stringedDocument);
	});

	// Join the bulk array elements with newline characters and add a trailing newline
	const stringedBulk = bulk.join('\n') + '\n';
	return stringedBulk;
};
