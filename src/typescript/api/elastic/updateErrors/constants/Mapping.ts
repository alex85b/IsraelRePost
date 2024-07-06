import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const UPDATE_ERROR_INDEX_MAPPING: MappingTypeMapping = {
	dynamic: 'strict',
	properties: {
		userError: { type: 'text' },
		services: {
			type: 'nested',
			properties: {
				serviceId: { type: 'keyword' },
				serviceError: { type: 'text' },
				dates: {
					type: 'nested',
					properties: {
						calendarId: { type: 'keyword' },
						datesError: { type: 'text' },
						timesError: { type: 'text' },
					},
				},
			},
		},
	},
};
