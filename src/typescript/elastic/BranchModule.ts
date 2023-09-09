import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { BaseElastic, IElasticResponseData } from './BaseElastic';
import { ISingleBranchQueryResponse } from './elstClient';
import { AxiosRequestConfig } from 'axios';

export class BranchModule extends BaseElastic {
	protected indexName: string = 'branches';
	protected indexMapping: MappingTypeMapping = {
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

	async fetchAllBranches() {
		const elasticResponse = await this.searchIndex<IQueryBranches, AxiosRequestConfig>({
			query: {
				match_all: {},
			},
			size: 500,
		});
		if (
			elasticResponse?.status &&
			(elasticResponse?.status < 200 || elasticResponse?.status > 299)
		) {
			throw new Error(`[Elastic] fetch-all-branches failed: ${elasticResponse.statusText}`);
		}
		return elasticResponse?.data?.hits?.hits ?? [];
	}
}

export interface IQueryBranches extends IElasticResponseData {
	hits: {
		total: {
			value: number;
			relation: string;
		};
		max_score: number;
		hits: ISingleBranchQueryResponse[];
	};
}
