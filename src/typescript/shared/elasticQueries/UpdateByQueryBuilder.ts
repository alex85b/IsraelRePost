import { InlineScript, QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

export interface ICustomUpdateByQuery {
	query: QueryDslQueryContainer;
	script: InlineScript;
}

export class UpdateByQueryBuilder {
	private updateByQueryRequest: ICustomUpdateByQuery;

	constructor() {
		this.updateByQueryRequest = { query: {}, script: { source: '' } };
	}

	withQuery(query: QueryDslQueryContainer): UpdateByQueryBuilder {
		this.updateByQueryRequest.query = query;
		return this;
	}

	withScript(script: InlineScript): UpdateByQueryBuilder {
		this.updateByQueryRequest.script = script;
		return this;
	}

	build(): ICustomUpdateByQuery {
		return this.updateByQueryRequest;
	}
}
