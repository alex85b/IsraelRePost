import {
	ElasticsearchClient,
	IElasticSearchResponse,
	IElasticsearchClient,
} from './base/ElasticsearchClient';
import {
	branchIndexName,
	branchIndexMapping,
	queryAllBranches,
	queryBranchesWithoutServices,
	allBranchesExcludingQuery,
} from '../../shared/constants/indices/BranchIndex';
import { bulkBranchDocuments } from './IndexingUtils';

export class BranchServicesIndexing {
	private eClient: IElasticsearchClient;

	constructor() {
		this.eClient = ElasticsearchClient.getInstance();
	}

	async fetchAllBranches() {
		const results = await this.eClient.searchIndex<IQueryBranches>({
			indexName: branchIndexName,
			query: queryAllBranches,
		});
		return results.data?.hits?.hits ?? [];
	}

	async branchesWithoutServices() {
		const results = await this.eClient.searchIndex<IQueryBranches>({
			indexName: branchIndexName,
			query: queryBranchesWithoutServices,
		});
		return results.data?.hits?.hits ?? [];
	}

	// async getQnomyCodesExcluding(requestData: {
	// 	excludeBranchIds: string[];
	// }): Promise<IBranchQnomycodePair[]> {
	// 	const results = await this.eClient.searchIndex<IQueryBranches>({
	// 		indexName: branchIndexName,
	// 		query: buildAllBranchesExcludingQuery(requestData.excludeBranchIds),
	// 	});

	// 	const branches = results.data?.hits?.hits ?? [];

	// 	return branches.map((branch) => {
	// 		return { branchId: branch._id, qnomycode: branch._source.qnomycode };
	// 	});
	// }

	// async bulkAddBranches(requestData: { addBranches: IDocumentBranch[] }) {
	// 	// prepare bulk request data.
	// 	const bulk = bulkBranchDocuments({ addBranches: requestData.addBranches, branchIndexName });

	// 	const response = await this.eClient.bulkAdd({
	// 		indexName: branchIndexName,
	// 		bulkedDocuments: bulk,
	// 	});

	// 	const responseData = response.data;
	// 	const errors = responseData?.errors;
	// 	if (errors) {
	// 		console.error('[Branch Module][Bulk Add Branches]: Failed ', responseData);
	// 		throw new Error(
	// 			`[Branch Module][Bulk Add Branches][Index: ${branchIndexName}]: Response Had Errors`
	// 		);
	// 	}
	// 	const items = responseData?.items ?? [];
	// 	const returnReport: { status: number; id: string; action: string }[] = [];
	// 	items.forEach((itemBulked) => {
	// 		console.log(itemBulked);
	// 		returnReport.push({
	// 			status: itemBulked.index.status ?? -1,
	// 			id: itemBulked.index._id ?? 'No-id',
	// 			action: itemBulked.index.result ?? 'No-action',
	// 		});
	// 	});
	// 	return returnReport;
	// }

	// async updateBranchServices(branchID: string, services: INewServiceRecord[]) {
	// 	const query = {
	// 		term: {
	// 			_id: branchID,
	// 		},
	// 	};

	// 	const script = {
	// 		source: 'ctx._source.services = params.updatedServicesArray',
	// 		lang: 'painless',
	// 		params: {
	// 			updatedServicesArray: services,
	// 		},
	// 	};

	// 	const response = await this.eClient.updateRecordByQ({
	// 		indexName: branchIndexName,
	// 		query: query,
	// 		script: script,
	// 	});

	// 	const updatedAmount = response.data?.updated ?? -1;
	// 	const failures = response.data?.failures ?? [];

	// 	if (failures.length > 0) {
	// 		throw new Error(
	// 			`[Branch Module][Update Branch Services]: Response Had {${failures.length}} Errors`
	// 		);
	// 	}

	// 	return { updated: updatedAmount };
	// }

	// async fetchAllQnomyCodes(): Promise<IBranchQnomycodePair[]> {
	// 	const results = await this.eClient.searchIndex<IQueryQnomycode>({
	// 		indexName: branchIndexName,
	// 		query: {
	// 			_source: ['qnomycode'], // Specify the fields to include in the results
	// 			query: {
	// 				match_all: {},
	// 			},
	// 			size: 500,
	// 		},
	// 	});
	// 	// return results.data?.hits.hits[0]._source.qnomycode
	// 	const qnomyCodes = results.data?.hits?.hits ?? [];
	// 	return qnomyCodes.map((hit) => {
	// 		return { branchId: hit._id, qnomycode: hit._source.qnomycode };
	// 	});
	// }
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
