import {
	ElasticsearchClient,
	IElasticBulkResponse,
	IElasticCreateIndexResponse,
	IElasticDeleteByQResponse,
	IElasticDeleteResponse,
	IElasticSearchResponse,
	IElasticUpdateByQResponse,
	IElasticsearchClient,
} from '../base/ElasticsearchClient';
import { bulkBranchDocuments } from './BranchServicesUtils';
import { buildAllRecordsQuery } from '../shared/queryBuilders/QueryAllRecordsBuilder';
import { buildDeleteAllRecordsQuery } from '../shared/queryBuilders/DeleteByQueryBuilder';
import { BRANCH_INDEX_NAME } from './constants/Index';
import { BRANCH_INDEX_MAPPING } from './constants/Mapping';
import { searchAllBranchesRequest } from './requests/SearchAllBranchesRequest';
import { branchesWithoutServicesRequest } from './requests/SearchBranchesWithoutServices';
import { updateBranchServicesRequest } from './requests/UpdateBranchServicesRequest';
import { AxiosResponse } from 'axios';

const MODULE_NAME = 'Branch Services Indexing';

// ###################################################################################################
// ### BranchServicesIndexing Interface ##############################################################
// ###################################################################################################

export interface IBranchServicesIndexing {
	createBranchIndex(): Promise<
		Omit<AxiosResponse<IElasticCreateIndexResponse>, 'request' | 'config'>
	>;

	deleteBranchIndex(): Promise<Omit<AxiosResponse<IElasticDeleteResponse>, 'request' | 'config'>>;

	fetchAllBranches(data: {
		maxRecords: number;
	}): Promise<Omit<AxiosResponse<IQueryBranches>, 'request' | 'config'>>;

	branchesWithoutServices(): Promise<Omit<AxiosResponse<IQueryBranches>, 'request' | 'config'>>;

	getBranchesExcluding(requestData: {
		excludeBranchIds: string[];
	}): Promise<Omit<AxiosResponse<IQueryBranches>, 'request' | 'config'>>;

	bulkAddBranches(requestData: {
		addBranches: IDocumentBranch[];
	}): Promise<Omit<AxiosResponse<IElasticBulkResponse>, 'request' | 'config'>>;

	updateBranchServices(requestData: {
		branchID: string;
		services: INewServiceRecord[];
	}): Promise<Omit<AxiosResponse<IElasticUpdateByQResponse>, 'request' | 'config'>>;

	deleteAllBranches(): Promise<
		Omit<AxiosResponse<IElasticDeleteByQResponse>, 'request' | 'config'>
	>;

	fetchAllQnomyCodes(): Promise<Omit<AxiosResponse<IQueryQnomycode>, 'request' | 'config'>>;
}

// ###################################################################################################
// ### BranchServicesIndexing Class ##################################################################
// ###################################################################################################

export class BranchServicesIndexing implements IBranchServicesIndexing {
	private eClient: IElasticsearchClient;

	constructor() {
		this.eClient = ElasticsearchClient.getInstance();
	}

	async createBranchIndex() {
		return await this.eClient.createIndex({
			indexName: BRANCH_INDEX_NAME,
			indexMapping: BRANCH_INDEX_MAPPING,
		});
	}

	async deleteBranchIndex() {
		return await this.eClient.deleteIndex({
			indexName: BRANCH_INDEX_NAME,
		});
	}

	async fetchAllBranches(data: { maxRecords: number }) {
		return await this.eClient.searchIndex<IQueryBranches>({
			indexName: BRANCH_INDEX_NAME,
			request: searchAllBranchesRequest({ maxRecords: data.maxRecords }),
		});
	}

	async branchesWithoutServices() {
		return await this.eClient.searchIndex<IQueryBranches>({
			indexName: BRANCH_INDEX_NAME,
			request: branchesWithoutServicesRequest({ maxRecords: 500 }),
		});
	}

	async getBranchesExcluding(requestData: { excludeBranchIds: string[] }) {
		return await this.eClient.searchIndex<IQueryBranches>({
			indexName: BRANCH_INDEX_NAME,
			request: searchAllBranchesRequest({
				excludeBranches: requestData.excludeBranchIds,
				maxRecords: 500,
			}),
		});
	}

	async bulkAddBranches(requestData: { addBranches: IDocumentBranch[] }) {
		// prepare bulk request data.
		const bulk = bulkBranchDocuments({
			addBranches: requestData.addBranches,
			branchIndexName: BRANCH_INDEX_NAME,
		});
		return await this.eClient.bulkAdd({
			indexName: BRANCH_INDEX_NAME,
			bulkedDocuments: bulk,
		});
	}

	async updateBranchServices(requestData: { branchID: string; services: INewServiceRecord[] }) {
		return await this.eClient.updateRecordByQ({
			indexName: BRANCH_INDEX_NAME,
			request: updateBranchServicesRequest({
				branchID: requestData.branchID,
				params: { updatedServicesArray: requestData.services },
			}),
		});
	}

	async deleteAllBranches() {
		return await this.eClient.deleteRecordsByQ({
			indexName: BRANCH_INDEX_NAME,
			request: buildDeleteAllRecordsQuery(),
		});
	}

	async fetchAllQnomyCodes() {
		return await this.eClient.searchIndex<IQueryQnomycode>({
			indexName: BRANCH_INDEX_NAME,
			request: buildAllRecordsQuery({ maxRecords: 500, specificFields: ['qnomycode'] }),
		});
	}
}
// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

// ##############################################
// ### Search Branch Response ###################
// ##############################################

// 5.
export interface INewDateEntryRecord {
	calendarId: string;
	calendarDate: string;
	hours: string[];
}

// 4.
export interface INewServiceRecord {
	serviceId: string;
	serviceName: string;
	dates: INewDateEntryRecord[];
}

// 3.
export interface IDocumentBranch {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string;
	city: string;
	cityEN: string;
	street: string;
	streetEN: string;
	streetcode: string;
	zip: string;
	qnomycode: number;
	qnomyWaitTimeCode: number;
	haszimuntor: number;
	isMakeAppointment: number;
	location: {
		lat: number;
		lon: number;
	};
	services: INewServiceRecord[];
}

// 2.
export interface ISingleBranchQueryResponse {
	_index: string;
	_id: string;
	_score: number;
	_source: IDocumentBranch;
}

// 1.
export interface IQueryBranches extends IElasticSearchResponse {
	hits: {
		total: {
			value: number;
			relation: string;
		};
		max_score: number;
		hits: ISingleBranchQueryResponse[];
	};
}

// ##############################################
// ### Search Qnomycode Response ################
// ##############################################

// 1.
export interface ISingleQnomycodeQueryResponse {
	_index: string;
	_id: string;
	_score: number;
	_source: {
		qnomycode: number;
	};
}

// 2.
export interface IQueryQnomycode extends IElasticSearchResponse {
	hits: {
		total: {
			value: number;
			relation: string;
		};
		max_score: number;
		hits: ISingleQnomycodeQueryResponse[];
	};
}
