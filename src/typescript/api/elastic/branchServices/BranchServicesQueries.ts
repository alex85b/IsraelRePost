import {
	InlineScript,
	QueryDslQueryContainer,
	SearchRequest,
} from '@elastic/elasticsearch/lib/api/types';

import { IAllRecordsQuery } from '../../../shared/elasticQueries/QueryAllRecords';
import { SearchRequestBuilder } from '../../../shared/elasticQueries/SearchRequestBuilder';
import { UpdateByQueryBuilder } from '../../../shared/elasticQueries/UpdateByQueryBuilder';

// ###################################################################################################
// ### Query Interfaces ##############################################################################
// ###################################################################################################

interface ISpecificBranchQuery extends QueryDslQueryContainer {
	term: {
		_id: string;
	};
}

interface IBranchExcludingQuery extends QueryDslQueryContainer {
	bool: {
		must_not: [
			{
				terms: {
					branchnumber: string[];
				};
			}
		];
	};
}

interface IBranchesWithoutServices extends QueryDslQueryContainer {
	bool: {
		// Constructing a boolean query
		must_not: {
			// We are looking for documents that do NOT have:
			nested: {
				// A nested object within the "services" path
				path: 'services';
				query: {
					// We perform a query within the nested object:
					bool: {
						// This is another boolean query
						must: [
							// We expect documents to (Not) meet these conditions:
							{ match_all: {} } // Match all nested documents under "services"
						];
					};
				};
			};
		};
	};
}

export interface ICustomUpdateByQuery {
	query: QueryDslQueryContainer;
	script: InlineScript;
}

// ###################################################################################################
// ### Script Interfaces #############################################################################
// ###################################################################################################

interface ISpecificServiceScript extends InlineScript {
	source: 'ctx._source.services = params.updatedServicesArray';
	lang: 'painless';
	params: {};
}

// ###################################################################################################
// ### Builders ######################################################################################
// ###################################################################################################

// ##############################################
// ### Build Branches Query #####################
// ##############################################

export const buildBranchesQuery = (buildData: {
	maxRecords: number;
	specificFields?: string[];
}): SearchRequest => {
	const QUERY_ALL_BRANCHES: IAllRecordsQuery = { match_all: {} };

	const branchSearchRequestBuilder = new SearchRequestBuilder()
		.withQuery(QUERY_ALL_BRANCHES)
		.withSize(buildData.maxRecords);

	if (buildData.specificFields)
		branchSearchRequestBuilder.withSpecificFields(buildData.specificFields);

	return branchSearchRequestBuilder.build();
};

// ##############################################
// ### Build Branches Without Services Query ####
// ##############################################

export const buildBranchesWithoutServicesQuery = (buildData: {
	maxRecords: number;
}): SearchRequest => {
	const QUERY_BRANCHES_WITHOUT_SERVICES: IBranchesWithoutServices = {
		bool: {
			must_not: {
				nested: {
					path: 'services',
					query: {
						bool: {
							must: [{ match_all: {} }],
						},
					},
				},
			},
		},
	};
	return new SearchRequestBuilder()
		.withQuery(QUERY_BRANCHES_WITHOUT_SERVICES)
		.withSize(buildData.maxRecords)
		.build();
};

// ##############################################
// ### Build Branches Excluding Query ###########
// ##############################################

export const buildBranchesExcludingQuery = (buildData: {
	maxRecords: number;
	excludeBranches: string[];
}): SearchRequest => {
	const QUERY_ALL_BRANCHES_EXCLUDING: IBranchExcludingQuery = {
		bool: {
			must_not: [
				{
					terms: {
						branchnumber: buildData.excludeBranches,
					},
				},
			],
		},
	};
	return new SearchRequestBuilder()
		.withQuery(QUERY_ALL_BRANCHES_EXCLUDING)
		.withSize(buildData.maxRecords)
		.build();
};

// ##############################################
// ### Build Update Branch Services Query #######
// ##############################################

export const buildUpdateBranchServicesQuery = (buildData: {
	branchID: string;
	params: {};
}): ICustomUpdateByQuery => {
	const QUERY_SPECIFIC_BRANCH: ISpecificBranchQuery = {
		term: { _id: buildData.branchID },
	};
	const SPECIFIC_SERVICE_SCRIPT: ISpecificServiceScript = {
		source: 'ctx._source.services = params.updatedServicesArray',
		lang: 'painless',
		params: buildData.params,
	};

	const request = new UpdateByQueryBuilder()
		.withQuery(QUERY_SPECIFIC_BRANCH)
		.withScript(SPECIFIC_SERVICE_SCRIPT)
		.build();

	console.log('[buildUpdateBranchServicesQuery] : ', request);
	return request;
};
