import { QueryDslQueryContainer, SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { SearchRequestBuilder } from '../../shared/requestBuilders/SearchRequestBuilder';

export interface IBranchesWithoutServices extends QueryDslQueryContainer {
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

// ##############################################
// ### Search Branches Without Services Request #
// ##############################################

export const branchesWithoutServicesRequest = (buildData: {
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
