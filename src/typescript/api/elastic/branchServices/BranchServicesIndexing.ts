import {
	ElasticsearchClient,
	IElasticSearchResponse,
	IElasticsearchClient,
} from '../base/ElasticsearchClient';
import { BRANCH_INDEX_MAPPING } from '../../../shared/constants/elasticIndices/branch/Mapping';
import { BRANCH_INDEX_NAME } from '../../../shared/constants/elasticIndices/branch/Index';
import {
	buildBranchesExcludingQuery,
	buildBranchesWithoutServicesQuery,
	buildUpdateBranchServicesQuery,
} from './BranchServicesQueries';
import { bulkBranchDocuments } from './BranchServicesUtils';
import { buildAllRecordsQuery } from '../../../shared/elasticQueries/QueryAllRecords';
import { buildDeleteAllRecordsQuery } from '../../../shared/elasticQueries/DeleteAllRecordsByQuery';

const MODULE_NAME = 'Branch Services Indexing';

// ###################################################################################################
// ### BranchServicesIndexing Interface ##############################################################
// ###################################################################################################

interface IBranchServicesIndexing {
	createBranchIndex(): Promise<boolean>;

	deleteBranchIndex(): Promise<boolean>;

	fetchAllBranches(): Promise<ISingleBranchQueryResponse[]>;

	branchesWithoutServices(): Promise<ISingleBranchQueryResponse[]>;

	getQnomyCodesExcluding(requestData: {
		excludeBranchIds: string[];
	}): Promise<IBranchQnomycodePair[]>;

	bulkAddBranches(requestData: {
		addBranches: IDocumentBranch[];
	}): Promise<{ status: number; id: string; action: string }[]>;

	updateBranchServices(requestData: {
		branchID: string;
		services: INewServiceRecord[];
	}): Promise<{ updated: number }>;

	deleteAllBranches(): Promise<number>;

	fetchAllQnomyCodes(): Promise<IBranchQnomycodePair[]>;
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
		const pingResult = await this.eClient.pingIndex({ indexName: BRANCH_INDEX_NAME });
		let createResult = false;
		if (pingResult != 200) {
			createResult = await this.eClient.createIndex({
				indexName: BRANCH_INDEX_NAME,
				indexMapping: BRANCH_INDEX_MAPPING,
			});
		}
		return createResult;
	}

	async deleteBranchIndex() {
		const pingResult = await this.eClient.pingIndex({ indexName: BRANCH_INDEX_NAME });
		let deleteResult = false;
		if (pingResult === 200) {
			deleteResult =
				(await this.eClient.deleteIndex({
					indexName: BRANCH_INDEX_NAME,
				})) ?? false;
		}
		return deleteResult;
	}

	async fetchAllBranches() {
		const results = await this.eClient.searchIndex<IQueryBranches>({
			indexName: BRANCH_INDEX_NAME,
			query: buildAllRecordsQuery({ maxRecords: 500 }),
		});
		return results.data?.hits?.hits ?? [];
	}

	async branchesWithoutServices() {
		const results = await this.eClient.searchIndex<IQueryBranches>({
			indexName: BRANCH_INDEX_NAME,
			query: buildBranchesWithoutServicesQuery({ maxRecords: 500 }),
		});
		return results.data?.hits?.hits ?? [];
	}

	async getQnomyCodesExcluding(requestData: {
		excludeBranchIds: string[];
	}): Promise<IBranchQnomycodePair[]> {
		const results = await this.eClient.searchIndex<IQueryBranches>({
			indexName: BRANCH_INDEX_NAME,
			query: buildBranchesExcludingQuery({
				excludeBranches: requestData.excludeBranchIds,
				maxRecords: 500,
			}),
		});

		const branches = results.data?.hits?.hits ?? [];

		return branches.map((branch) => {
			return { branchId: branch._id, qnomycode: branch._source.qnomycode };
		});
	}

	async bulkAddBranches(requestData: { addBranches: IDocumentBranch[] }) {
		// prepare bulk request data.
		const bulk = bulkBranchDocuments({
			addBranches: requestData.addBranches,
			branchIndexName: BRANCH_INDEX_NAME,
		});

		const response = await this.eClient.bulkAdd({
			indexName: BRANCH_INDEX_NAME,
			bulkedDocuments: bulk,
		});

		const responseData = response.data;
		const errors = responseData?.errors;
		if (errors) {
			console.error('[Branch Module][Bulk Add Branches]: Failed ', responseData);
			throw new Error(
				`[${MODULE_NAME}][Bulk Add Branches][Index: ${BRANCH_INDEX_NAME}]: Response Had Errors`
			);
		}

		const items = responseData?.items ?? [];
		const returnReport: { status: number; id: string; action: string }[] = [];
		items.forEach((itemBulked) => {
			returnReport.push({
				status: itemBulked.index.status ?? -1,
				id: itemBulked.index._id ?? 'No-id',
				action: itemBulked.index.result ?? 'No-action',
			});
		});
		return returnReport;
	}

	async updateBranchServices(requestData: { branchID: string; services: INewServiceRecord[] }) {
		const response = await this.eClient.updateRecordByQ({
			indexName: BRANCH_INDEX_NAME,
			query: buildUpdateBranchServicesQuery({
				branchID: requestData.branchID,
				params: { updatedServicesArray: requestData.services },
			}),
		});

		const updatedAmount = response.data?.updated ?? -1;
		const failures = response.data?.failures ?? [];
		if (failures.length > 0) {
			throw new Error(
				`[${MODULE_NAME}][Update Branch Services]: Response Had {${failures.length}} Errors`
			);
		}
		return { updated: updatedAmount };
	}

	async deleteAllBranches() {
		const results = await this.eClient.deleteRecordsByQ({
			indexName: BRANCH_INDEX_NAME,
			query: buildDeleteAllRecordsQuery(),
		});

		console.log(`[${MODULE_NAME}][Delete All Branches][Index: ${BRANCH_INDEX_NAME}]`, results);

		const failures = results.data?.failures ?? [];
		const deletedAmount = results.data?.deleted ?? 0;

		if (Array.isArray(failures) && failures.length > 0) {
			console.error(`[${MODULE_NAME}][Delete All Branches]: Failed `, results);
			throw new Error(
				`[${MODULE_NAME}][Delete All Branches][Index: ${BRANCH_INDEX_NAME}]: Response Had Errors`
			);
		}
		return deletedAmount;
	}

	async fetchAllQnomyCodes(): Promise<IBranchQnomycodePair[]> {
		const results = await this.eClient.searchIndex<IQueryQnomycode>({
			indexName: BRANCH_INDEX_NAME,
			query: buildAllRecordsQuery({ maxRecords: 500, specificFields: ['qnomycode'] }),
		});

		const qnomyCodes = results.data?.hits?.hits ?? [];
		return qnomyCodes.map((hit) => {
			return { branchId: hit._id, qnomycode: hit._source.qnomycode };
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

// ##############################################
// ### fetchAllQnomyCodes Return ################
// ##############################################

export interface IBranchQnomycodePair {
	branchId: string;
	qnomycode: number;
}
