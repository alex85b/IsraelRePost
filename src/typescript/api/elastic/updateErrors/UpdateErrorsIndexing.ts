import {
	ElasticsearchClient,
	IElasticCrUpRecordResponse,
	IElasticDeleteByQResponse,
	IElasticSearchResponse,
	IElasticsearchClient,
} from '../base/ElasticsearchClient';
import { UPDATE_ERRORS_INDEX_NAME } from './constants/Index';
import { buildAllRecordsQuery } from '../shared/queryBuilders/QueryAllRecordsBuilder';
import { buildDeleteAllRecordsQuery } from '../shared/queryBuilders/DeleteByQueryBuilder';
import { AxiosResponse } from 'axios';

const MODULE_NAME = 'Branch Services Indexing';

// ###################################################################################################
// ### Interface : IUpdateErrorsIndexing #############################################################
// ###################################################################################################

export interface IUpdateErrorsIndexing {
	fetchAllErrors(): Promise<Omit<AxiosResponse<IQueryErrors>, 'request' | 'config'>>;

	updateAddError(buildData: {
		errorRecord: IErrorMapping;
		branchIndex: number;
	}): Promise<Omit<AxiosResponse<IElasticCrUpRecordResponse>, 'request' | 'config'>>;

	deleteAllErrors(): Promise<
		Omit<AxiosResponse<IElasticDeleteByQResponse>, 'request' | 'config'>
	>;
}

// ###################################################################################################
// ### UpdateErrorsIndexing Class ####################################################################
// ###################################################################################################

export class UpdateErrorsIndexing implements IUpdateErrorsIndexing {
	private eClient: IElasticsearchClient;

	constructor() {
		this.eClient = ElasticsearchClient.getInstance();
	}

	// TODO: Create Index
	// TODO: Delete Index

	async fetchAllErrors() {
		return await this.eClient.searchIndex<IQueryErrors>({
			indexName: UPDATE_ERRORS_INDEX_NAME,
			request: buildAllRecordsQuery({ maxRecords: 500 }),
		});
	}

	async updateAddError(buildData: { errorRecord: IErrorMapping; branchIndex: number }) {
		return await this.eClient.addUpdateRecord({
			indexName: UPDATE_ERRORS_INDEX_NAME,
			documentId: buildData.branchIndex,
			record: buildData.errorRecord,
		});
	}

	async deleteAllErrors() {
		return await this.eClient.deleteRecordsByQ({
			indexName: UPDATE_ERRORS_INDEX_NAME,
			request: buildDeleteAllRecordsQuery(),
		});
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
