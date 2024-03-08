import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { BaseElastic, IElasticSearchResponse } from './BaseElastic';

export class ErrorIndexService extends BaseElastic {
	protected indexName: string = 'errors';
	protected indexMapping: MappingTypeMapping = {
		dynamic: 'strict',
		properties: {
			userError: { type: 'text' },
			services: {
				type: 'nested',
				properties: {
					serviceId: { type: 'keyword' },
					serviceError: { type: 'text' },
					dates: {
						type: 'nested',
						properties: {
							calendarId: { type: 'keyword' },
							datesError: { type: 'text' },
							timesError: { type: 'text' },
						},
					},
				},
			},
		},
	};

	async fetchAllErrors() {
		const results = await this.searchIndex<IQueryErrors>({
			query: {
				match_all: {},
			},
			size: 500,
		});
		return results.data?.hits.hits ?? [];
	}

	async updateAddError(errorRecord: IErrorMapping, branchIndex: number) {
		const results = await this.addUpdateRecord(branchIndex, errorRecord);
		return results.data?.result; // Created or Updated.
	}

	async deleteAllErrors() {
		const results = await this.deleteRecordsByQ({
			match_all: {},
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
