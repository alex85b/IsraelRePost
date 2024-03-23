import { RequestBody } from '@elastic/elasticsearch';

export const QUERY_ALL_BRANCHES: RequestBody = {
	query: {
		match_all: {},
	},
	size: 500,
};

export const QUERY_BRANCHES_WITHOUT_SERVICES: RequestBody = {
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

export const QUERY_ALL_BRANCHES_EXCLUDING: RequestBody = {
	query: {
		bool: {
			must_not: [
				{
					terms: {
						branchnumber: undefined,
					},
				},
			],
		},
	},
	size: 500,
};
