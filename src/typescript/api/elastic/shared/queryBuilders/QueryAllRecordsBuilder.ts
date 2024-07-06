import { QueryDslQueryContainer, SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { SearchRequestBuilder } from '../requestBuilders/SearchRequestBuilder';

export interface IAllRecordsQuery extends QueryDslQueryContainer {
	match_all: {};
}

export const buildAllRecordsQuery = (buildData: {
	maxRecords: number;
	specificFields?: string[];
}): SearchRequest => {
	const QUERY_ALL_RECORDS: IAllRecordsQuery = { match_all: {} };

	const branchSearchRequestBuilder = new SearchRequestBuilder()
		.withQuery(QUERY_ALL_RECORDS)
		.withSize(buildData.maxRecords);

	if (buildData.specificFields)
		branchSearchRequestBuilder.withSpecificFields(buildData.specificFields);

	return branchSearchRequestBuilder.build();
};
