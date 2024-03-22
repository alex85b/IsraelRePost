import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { RequestBody } from '@elastic/elasticsearch';

export const branchIndexName: string = 'branches';

export const branchIndexMapping: MappingTypeMapping = {
	dynamic: 'strict',
	properties: {
		id: { type: 'integer' },
		branchnumber: { type: 'integer' },
		branchname: { type: 'text' },
		branchnameEN: { type: 'text' },
		city: { type: 'text' },
		cityEN: { type: 'text' },
		street: { type: 'text' },
		streetEN: { type: 'text' },
		streetcode: { type: 'keyword' },
		zip: { type: 'keyword' },
		qnomycode: { type: 'integer' },
		qnomyWaitTimeCode: { type: 'integer' },
		haszimuntor: { type: 'integer' },
		isMakeAppointment: { type: 'integer' },
		location: { type: 'geo_point' },
		services: {
			type: 'nested',
			properties: {
				serviceId: { type: 'keyword' },
				serviceName: { type: 'keyword' },
				dates: {
					type: 'nested',
					properties: {
						calendarId: { type: 'keyword' },
						calendarDate: { type: 'date', format: "yyyy-MM-dd'T'HH:mm:ss" },
						hours: {
							type: 'text',
							fields: {
								keyword: { type: 'keyword' },
							},
						},
					},
				},
			},
		},
	},
};

export const queryAllBranches: RequestBody = {
	query: {
		match_all: {},
	},
	size: 500,
};

export const queryBranchesWithoutServices: RequestBody = {
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

export const allBranchesExcludingQuery: RequestBody = {
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
