import { QueryDslQueryContainer, SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { SearchRequestBuilder } from '../requestBuilders/SearchRequestBuilder';

export const buildDeleteAllRecordsQuery = (): SearchRequest => {
	const QUERY_ALL_BRANCHES: QueryDslQueryContainer = { match_all: {} };
	const returnQuery = new SearchRequestBuilder().withQuery(QUERY_ALL_BRANCHES).build();
	// console.log(`[buildDeleteAllBranchesQuery] : `, returnQuery);
	return returnQuery;
};

export const buildDeleteRecordQuery = (buildData: { recordId: string }): SearchRequest => {
	const QUERY_BRANCH: QueryDslQueryContainer = {
		term: { _id: buildData.recordId },
	};
	const returnQuery = new SearchRequestBuilder().withQuery(QUERY_BRANCH).build();
	// console.log(`[buildDeleteRecordQuery] : `, returnQuery);
	return returnQuery;
};
