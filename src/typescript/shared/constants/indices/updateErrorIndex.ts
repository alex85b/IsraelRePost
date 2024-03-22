import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const updateErrorIndexName: string = 'errors';

export const updateErrorIndexMapping: MappingTypeMapping = {
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
