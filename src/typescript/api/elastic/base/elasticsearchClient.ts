import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';

import { ELASTIC_BASE_URL } from '../../../shared/constants/ApiEndpoints';
import { getAuthenticationData } from './ElasticsearchUtils';

// ###################################################################################################
// ### Singleton ElasticsearchClient #################################################################
// ###################################################################################################

export class ElasticsearchClient implements IElasticsearchClient {
	private static instance: ElasticsearchClient;
	private customRequestConfig: CustomRequestConfig;

	// Private constructor to prevent direct instantiation
	private constructor() {
		const { certificates, password, username } = getAuthenticationData();

		this.customRequestConfig = new CustomRequestConfig.Builder()
			.auth({ password, username })
			.baseURL(ELASTIC_BASE_URL)
			.validateStatus((status: number) => true)
			.httpsAgent(
				new https.Agent({
					ca: certificates,
				})
			)
			.build();
	}

	public static getInstance(): ElasticsearchClient {
		if (!ElasticsearchClient.instance) {
			ElasticsearchClient.instance = new ElasticsearchClient();
		}
		return ElasticsearchClient.instance;
	}

	private async makeElasticRequest<R>(requestData: {
		axiosRequestConfig: AxiosRequestConfig;
		callerName: string;
		indexName: string;
		checkStatus?: boolean;
	}) {
		const { axiosRequestConfig, callerName, indexName, checkStatus = true } = requestData;
		try {
			const axiosResponse = await axios.request<
				AxiosRequestConfig,
				AxiosResponse<R, AxiosRequestConfig>
			>(axiosRequestConfig);

			// if (checkStatus && (axiosResponse.status > 299 || axiosResponse.status < 200)) {
			// 	if (axiosResponse.data) console.error('Error response: ', axiosResponse.data);
			// 	if (axiosResponse.data) console.error('Error response: ', axiosResponse.data);
			// 	if (axiosResponse.statusText)
			// 		console.error('Error StatusText: ', axiosResponse.statusText);
			// 	throw new Error(
			// 		`[Base Elastic][${callerName}][Index: ${indexName}][Response-Status: ${axiosResponse.status}]`
			// 	);
			// }

			return {
				status: axiosResponse.status ?? -1,
				statusText: axiosResponse.statusText ?? 'Nothing',
				data: axiosResponse.data ?? null,
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.code === 'ECONNREFUSED') {
					throw new Error(
						`[Elasticsearch Client][${requestData.callerName}] Connect ${error.code} ${error.config?.baseURL} ${error.config?.url}`
					);
				}
			}
			throw error;
		}
	}

	async pingIndex(requestData: { indexName: string }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'HEAD';
		axiosRequestConfig.url = requestData.indexName;

		const elasticResponse = await this.makeElasticRequest({
			axiosRequestConfig,
			callerName: 'Ping Index',
			indexName: requestData.indexName,
			checkStatus: false,
		});

		return elasticResponse.status;
	}

	async searchIndex<R extends IElasticSearchResponse>(requestData: {
		indexName: string;
		query: any;
	}) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.url = `/${requestData.indexName}/_search`;
		axiosRequestConfig.method = 'GET';
		axiosRequestConfig.data = requestData.query;

		const elasticResponse = await this.makeElasticRequest<R>({
			axiosRequestConfig,
			callerName: 'Search Index',
			indexName: requestData.indexName,
		});

		return {
			hitsAmount: elasticResponse.data?.hits?.total?.value ?? 0,
			data: elasticResponse.data,
		};
	}

	async deleteIndex(requestData: { indexName: string }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'DELETE';
		axiosRequestConfig.url = requestData.indexName;

		const elasticResponse = await this.makeElasticRequest<IElasticDeleteResponse>({
			axiosRequestConfig,
			callerName: 'Delete Index',
			indexName: requestData.indexName,
		});

		return elasticResponse.data?.acknowledged;
	}

	async createIndex(requestData: { indexName: string; indexMapping: MappingTypeMapping }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'PUT';
		axiosRequestConfig.url = requestData.indexName;
		axiosRequestConfig.data = { mappings: requestData.indexMapping };

		const ping = await this.pingIndex({ indexName: requestData.indexName });
		if (ping != 200) {
			const elasticResponse = await this.makeElasticRequest<IElasticCreateIndexResponse>({
				axiosRequestConfig,
				callerName: 'Create Index',
				indexName: requestData.indexName,
			});
			return elasticResponse.data?.acknowledged ?? false;
		}
		return true;
	}

	async getIndexMapping(requestData: { indexName: string }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'GET';
		axiosRequestConfig.url = `${requestData.indexName}/_mapping`;

		const elasticResponse = await this.makeElasticRequest<MappingTypeMapping>({
			axiosRequestConfig,
			callerName: 'Get Index Mapping',
			indexName: requestData.indexName,
		});

		return elasticResponse.data;
	}

	async addUpdateRecord(requestData: { indexName: string; documentId: number; record: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.url = `/${requestData.indexName}/_doc/${requestData.documentId}`;
		axiosRequestConfig.data = requestData.record;

		const elasticResponse = await this.makeElasticRequest<IElasticCrUpRecordResponse>({
			axiosRequestConfig,
			callerName: 'Add Update Record',
			indexName: requestData.indexName,
		});

		const data = elasticResponse.data;

		return {
			status: elasticResponse.status ?? -1,
			statusText: elasticResponse.statusText ?? ' No status text',
			data: data,
		};
	}

	async bulkAdd(requestData: { indexName: string; bulkedDocuments: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.url = '_bulk';
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.data = requestData.bulkedDocuments;
		axiosRequestConfig['headers'] = { 'Content-Type': 'application/x-ndjson' };

		const elasticResponse = await this.makeElasticRequest<IElasticBulkResponse>({
			axiosRequestConfig,
			callerName: 'Bulk Add',
			indexName: requestData.indexName,
		});

		return elasticResponse;
	}

	async deleteRecordsByQ(requestData: { indexName: string; query: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.url = `/${requestData.indexName}/_delete_by_query`;
		axiosRequestConfig.data = requestData.query;

		const elasticResponse = await this.makeElasticRequest<IElasticDeleteByQResponse>({
			axiosRequestConfig,
			callerName: 'Delete Records',
			indexName: requestData.indexName,
		});

		const data = elasticResponse.data;

		return {
			status: elasticResponse.status ?? -1,
			statusText: elasticResponse.statusText ?? ' No status text',
			data: data,
		};
	}

	async updateRecordByQ(requestData: { indexName: string; query: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.url = `/${requestData.indexName}/_update_by_query`;
		axiosRequestConfig.data = requestData.query;

		console.log('[updateRecordByQ] axiosRequestConfig.data : ', axiosRequestConfig.data);

		const elasticResponse = await this.makeElasticRequest<IElasticUpdateByQResponse>({
			axiosRequestConfig,
			callerName: 'Update Record By Query',
			indexName: requestData.indexName,
		});

		const data = elasticResponse.data;

		return {
			status: elasticResponse.status ?? -1,
			statusText: elasticResponse.statusText ?? ' No status text',
			data: data,
		};
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IElasticsearchClient {
	pingIndex(requestData: { indexName: string }): Promise<number>;

	searchIndex<R extends IElasticSearchResponse>(requestData: {
		indexName: string;
		query: any;
	}): Promise<{ hitsAmount: number; data: R | null }>;

	deleteIndex(requestData: { indexName: string }): Promise<boolean | undefined>;

	createIndex(requestData: {
		indexName: string;
		indexMapping: MappingTypeMapping;
	}): Promise<boolean>;

	getIndexMapping(requestData: { indexName: string }): Promise<MappingTypeMapping | null>;

	addUpdateRecord(requestData: { indexName: string; documentId: number; record: any }): Promise<{
		status: number;
		statusText: string;
		data: IElasticCrUpRecordResponse | null;
	}>;

	bulkAdd(requestData: { indexName: string; bulkedDocuments: any }): Promise<{
		status: number;
		statusText: string;
		data: IElasticBulkResponse | null;
	}>;

	deleteRecordsByQ(requestData: { indexName: string; query: any }): Promise<{
		status: number;
		statusText: string;
		data: IElasticDeleteByQResponse | null;
	}>;

	updateRecordByQ(requestData: { indexName: string; query: any }): Promise<{
		status: number;
		statusText: string;
		data: IElasticUpdateByQResponse | null;
	}>;
}

// ##############################################
// ### Search Response ##########################
// ##############################################

export interface IElasticSearchResponse {
	took: number;
	timed_out: boolean;
	_shards: {
		total: number;
		successful: number;
		skipped: number;
		failed: number;
	};
	hits: {
		total: {
			value: number;
			relation: string;
		};
		max_score: number;
		hits: any[];
	};
}

// ##############################################
// ### Delete Branch Response ###################
// ##############################################

export interface IElasticDeleteResponse {
	acknowledged: boolean;
}

// ##############################################
// ### Delete Record Response ###################
// ##############################################

export interface IElasticDeleteByQResponse {
	took: number;
	timed_out: boolean;
	total: number;
	deleted: number;
	batches: number;
	version_conflicts: number;
	noops: number;
	retries: {
		bulk: number;
		search: number;
	};
	throttled_millis: number;
	requests_per_second: number;
	throttled_until_millis: number;
	failures: any[];
}

// ##############################################
// ### Create Response ##########################
// ##############################################

export interface IElasticCreateIndexResponse {
	acknowledged: boolean;
	shards_acknowledged: boolean;
	index: string;
}

// ##############################################
// ### Update a Record Response #################
// ##############################################

export interface IElasticUpdateByQResponse {
	took: number;
	timed_out: boolean;
	total: number;
	updated: number;
	deleted: number;
	batches: number;
	version_conflicts: number;
	noops: number;
	retries: {
		bulk: number;
		search: number;
	};
	throttled_millis: number;
	requests_per_second: number;
	throttled_until_millis: number;
	failures: any[];
}

// ##############################################
// ### Ping Response ############################
// ##############################################

// No response for ping.

// ##############################################
// ### Update \ Create Response #################
// ##############################################

export interface IElasticCrUpRecordResponse {
	_index: string;
	_id: string;
	_version: number;
	result: 'created' | 'updated';
	_shards: {
		total: number;
		successful: number;
		failed: number;
	};
	_seq_no: number;
	_primary_term: number;
	status?: number;
}

// ##############################################
// ### Bulk Update \ Create Response ############
// ##############################################

export interface IElasticBulkResponse {
	took: number;
	errors: boolean;
	items: { index: IElasticCrUpRecordResponse }[];
}

// ###################################################################################################
// ### Helper Class ##################################################################################
// ###################################################################################################

class CustomRequestConfig {
	private axiosRequestConfig: AxiosRequestConfig;

	private constructor(axiosRequestConfig: AxiosRequestConfig) {
		this.axiosRequestConfig = axiosRequestConfig;
	}

	getConfig() {
		return { ...this.axiosRequestConfig } as AxiosRequestConfig;
	}

	static Builder = class {
		private axiosRequestConfig: AxiosRequestConfig;
		constructor() {
			this.axiosRequestConfig = {};
		}

		auth(auth: { username: string; password: string }) {
			this.axiosRequestConfig.auth = auth;
			return this;
		}

		httpsAgent(httpsAgent: https.Agent) {
			this.axiosRequestConfig.httpsAgent = httpsAgent;
			return this;
		}

		baseURL(baseURL: string) {
			this.axiosRequestConfig.baseURL = baseURL;
			return this;
		}

		validateStatus(validateStatus: (status: number) => boolean) {
			this.axiosRequestConfig.validateStatus = validateStatus;
			return this;
		}

		build() {
			return new CustomRequestConfig(this.axiosRequestConfig);
		}
	};
}
