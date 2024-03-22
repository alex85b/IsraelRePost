import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

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
