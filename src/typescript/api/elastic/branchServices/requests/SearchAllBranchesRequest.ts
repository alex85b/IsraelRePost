import { QueryDslQueryContainer, SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { IAllRecordsQuery } from '../../shared/queryBuilders/QueryAllRecordsBuilder';
import { SearchRequestBuilder } from '../../shared/requestBuilders/SearchRequestBuilder';

// ##############################################
// ### Interface: Branch Excluding Query ########
// ##############################################

export interface IBranchExcludingQuery extends QueryDslQueryContainer {
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

// ##############################################
// ### Concrete Query Objects ###################
// ##############################################

const QUERY_ALL_BRANCHES: IAllRecordsQuery = { match_all: {} };
const QUERY_ALL_BRANCHES_EXCLUDING: IBranchExcludingQuery = {
	bool: {
		must_not: [
			{
				terms: {
					branchnumber: [''],
				},
			},
		],
	},
};

// ##############################################
// ### Search All Branches Request ##############
// ##############################################

export const searchAllBranchesRequest = (buildData: {
	maxRecords: number;
	specificFields?: string[];
	excludeBranches?: string[];
}): SearchRequest => {
	let actualQuery;
	if (buildData.excludeBranches) {
		actualQuery = QUERY_ALL_BRANCHES_EXCLUDING;
		actualQuery.bool.must_not[0].terms.branchnumber = buildData.excludeBranches;
	} else actualQuery = QUERY_ALL_BRANCHES;

	const branchSearchRequestBuilder = new SearchRequestBuilder()
		.withQuery(actualQuery)
		.withSize(buildData.maxRecords);

	if (buildData.specificFields)
		branchSearchRequestBuilder.withSpecificFields(buildData.specificFields);

	return branchSearchRequestBuilder.build();
};
