import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const testIndexName: string = 'test';

export const testIndexMapping: MappingTypeMapping = {
	dynamic: 'strict',
	properties: {
		field1: { type: 'text' },
		services: {
			type: 'nested',
			properties: {
				field1_1: { type: 'keyword' },
				field1_2: { type: 'text' },
			},
		},
	},
};
