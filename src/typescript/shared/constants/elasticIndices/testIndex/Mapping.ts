import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const TEST_INDEX_MAPPING: MappingTypeMapping = {
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
