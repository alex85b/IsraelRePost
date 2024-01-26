import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { BaseElastic, IElasticSearchResponse } from './BaseElastic';

export class BranchModule extends BaseElastic {
	protected indexName: string = 'branches';
	protected indexMapping: MappingTypeMapping = {
		dynamic: 'strict',
		properties: {
			id: { type: 'integer' },
			branchnumber: { type: 'integer' },
			branchname: { type: 'text' },
			branchnameEN: { type: 'text' },
			city: { type: 'text' },
			cityEN: { type: 'text' },
			street: { type: 'text' },
			streetEN: { type: 'text' },
			streetcode: { type: 'keyword' },
			zip: { type: 'keyword' },
			qnomycode: { type: 'integer' },
			qnomyWaitTimeCode: { type: 'integer' },
			haszimuntor: { type: 'integer' },
			isMakeAppointment: { type: 'integer' },
			location: { type: 'geo_point' },
			services: {
				type: 'nested',
				properties: {
					serviceId: { type: 'keyword' },
					serviceName: { type: 'keyword' },
					dates: {
						type: 'nested',
						properties: {
							calendarId: { type: 'keyword' },
							calendarDate: { type: 'date', format: "yyyy-MM-dd'T'HH:mm:ss" },
							hours: {
								type: 'text',
								fields: {
									keyword: { type: 'keyword' },
								},
							},
						},
					},
				},
			},
		},
	};

	async fetchAllBranches() {
		const results = await this.searchIndex<IQueryBranches>({
			query: {
				match_all: {},
			},
			size: 500,
		});
		return results.data?.hits?.hits ?? [];
	}

	async branchesWithoutServices() {
		const query = {
			query: {
				// Fetch all records that have an empty "services" field (no nested records)
				bool: {
					// Constructing a boolean query
					must_not: {
						// We are looking for documents that do NOT have:
						nested: {
							// A nested object within the "services" path
							path: 'services', // Specifically within the "services" path
							query: {
								// We perform a query within the nested object:
								bool: {
									// This is another boolean query
									must: [
										// We expect documents to meet these conditions:
										{ match_all: {} }, // Match all nested documents under "services"
									],
								},
							},
						},
					},
				},
			},
		};

		const results = await this.searchIndex<IQueryBranches>(query);
		// return results;
		return results.data?.hits?.hits ?? [];
	}

	async exclusiveQnomyCodes(excludeBranchIds: string[]): Promise<IBranchQnomycodePair[]> {
		const query = {
			query: {
				bool: {
					must_not: [
						{
							terms: {
								branchnumber: excludeBranchIds,
							},
						},
					],
				},
			},
			size: 500,
		};
		const results = await this.searchIndex<IQueryBranches>(query);
		const qnomyCodes = results.data?.hits?.hits ?? [];
		return qnomyCodes.map((hit) => {
			return { branchId: hit._id, qnomycode: hit._source.qnomycode };
		});
	}

	async bulkAddBranches(addBranches: IDocumentBranch[]) {
		// prepare bulk request data.
		let bulk: any = [];
		addBranches.forEach((branchDocument) => {
			bulk.push(
				JSON.stringify({
					index: {
						_index: this.indexName,
						_id: branchDocument.branchnumber.toString(),
					},
				}),
				JSON.stringify(branchDocument)
			);
		});
		bulk = bulk.join('\n') + '\n';

		const response = await this.bulkAdd(bulk);

		const responseData = response.data;
		const errors = responseData?.errors;
		if (errors) {
			console.error('[Branch Module][Bulk Add Branches]: Failed ', responseData);
			throw new Error(
				`[Branch Module][Bulk Add Branches][Index: ${this.indexName}]: Response Had Errors`
			);
		}
		const items = responseData?.items ?? [];
		const returnReport: { status: number; id: string; action: string }[] = [];
		items.forEach((itemBulked) => {
			console.log(itemBulked);
			returnReport.push({
				status: itemBulked.index.status ?? -1,
				id: itemBulked.index._id ?? 'No-id',
				action: itemBulked.index.result ?? 'No-action',
			});
		});
		return returnReport;
	}

	async updateBranchServices(branchID: string, services: INewServiceRecord[]) {
		const query = {
			term: {
				_id: branchID,
			},
		};

		const script = {
			source: 'ctx._source.services = params.updatedServicesArray',
			lang: 'painless',
			params: {
				updatedServicesArray: services,
			},
		};

		const response = await this.updateRecordByQ(query, script);
		const updatedAmount = response.data?.updated ?? -1;
		const failures = response.data?.failures ?? [];

		if (failures.length > 0) {
			throw new Error(
				`[Branch Module][Update Branch Services]: Response Had {${failures.length}} Errors`
			);
		}

		return { updated: updatedAmount };
	}

	async fetchAllQnomyCodes(): Promise<IBranchQnomycodePair[]> {
		const results = await this.searchIndex<IQueryQnomycode>({
			_source: ['qnomycode'], // Specify the fields to include in the results
			query: {
				match_all: {},
			},
			size: 500,
		});
		// return results.data?.hits.hits[0]._source.qnomycode
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
