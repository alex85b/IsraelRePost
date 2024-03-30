import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { IAllRecordsQuery } from './QueryAllRecords';
import { SearchRequestBuilder } from './SearchRequestBuilder';

export const buildDeleteAllRecordsQuery = (): SearchRequest => {
	const QUERY_ALL_BRANCHES: IAllRecordsQuery = { match_all: {} };
	const returnQuery = new SearchRequestBuilder().withQuery(QUERY_ALL_BRANCHES).build();
	console.log(`[buildDeleteAllBranchesQuery] : `, returnQuery);
	return returnQuery;
};
