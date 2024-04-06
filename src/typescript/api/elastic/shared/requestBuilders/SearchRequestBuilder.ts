import { QueryDslQueryContainer, SearchRequest } from '@elastic/elasticsearch/lib/api/types';

export class SearchRequestBuilder {
	private searchRequest: SearchRequest;

	constructor() {
		this.searchRequest = {};
	}

	withQuery(query: QueryDslQueryContainer): SearchRequestBuilder {
		this.searchRequest.query = query;
		return this;
	}

	withSize(size: number): SearchRequestBuilder {
		this.searchRequest.size = size;
		return this;
	}

	withSpecificFields(fieldNames: string[]) {
		this.searchRequest._source = fieldNames;
	}

	build(): SearchRequest {
		return this.searchRequest;
	}
}
