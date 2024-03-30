import {
	ElasticsearchClient,
	IElasticSearchResponse,
	IElasticsearchClient,
} from '../base/ElasticsearchClient';

import { UPDATE_ERRORS_INDEX_NAME } from '../../../shared/constants/elasticIndices/updateErrors/Index';
import { buildAllRecordsQuery } from '../../../shared/elasticQueries/QueryAllRecords';
import { buildDeleteAllRecordsQuery } from '../../../shared/elasticQueries/DeleteAllRecordsByQuery';

const MODULE_NAME = 'Branch Services Indexing';

export class UpdateErrorsIndexing {
	private eClient: IElasticsearchClient;

	constructor() {
		this.eClient = ElasticsearchClient.getInstance();
	}

	async fetchAllErrors() {
		const results = await this.eClient.searchIndex<IQueryErrors>({
			indexName: UPDATE_ERRORS_INDEX_NAME,
			query: buildAllRecordsQuery({ maxRecords: 500 }),
		});

		return results.data?.hits.hits ?? [];
	}

	async updateAddError(buildData: { errorRecord: IErrorMapping; branchIndex: number }) {
		const results = await this.eClient.addUpdateRecord({
			indexName: UPDATE_ERRORS_INDEX_NAME,
			documentId: buildData.branchIndex,
			record: buildData.errorRecord,
		});
		return results.data?.result ?? 'failed'; // Created or Updated.
	}

	async deleteAllErrors() {
		const results = await this.eClient.deleteRecordsByQ({
			indexName: UPDATE_ERRORS_INDEX_NAME,
			query: buildDeleteAllRecordsQuery(),
		});

		const deletedAmount = results.data?.deleted ?? -1;
		const failures = results.data?.failures ?? [];

		if (failures.length > 0) {
			throw new Error(
				`[Error Module][Delete All Errors]: Response Had {${failures.length}} Errors`
			);
		}

		return { deleted: deletedAmount };
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// ##############################################
// ### Search Response ##########################
// ##############################################

// 1.
export interface IQueryErrors extends IElasticSearchResponse {
	hits: {
		total: {
			value: number;
			relation: string;
		};
		max_score: number;
		hits: ISingleErrorQueryResponse[];
	};
}

// 2.
export interface ISingleErrorQueryResponse {
	_index: string;
	_id: string;
	_score: number;
	_source: IErrorMapping;
}

// 3.
export interface IErrorMapping {
	userError: string;
	services: IServiceError[];
}

// 4.
export interface IServiceError {
	serviceId: string;
	serviceError: string;
	dates: IDateError[];
}

// 5.
export interface IDateError {
	calendarId: string;
	datesError: string;
	timesError: string;
}

// ##############################################
// ### Error Index Service ######################
// ##############################################

interface IErrorIndexService {
	fetchAllErrors: () => Promise<ISingleErrorQueryResponse[]>;
	updateAddError: (
		errorRecord: IErrorMapping,
		branchIndex: number
	) => Promise<string | undefined>;
	deleteAllErrors: () => Promise<{ deleted: number }>;
}
