import { IndicesIndexSettings, MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import path from 'path';
import fs from 'fs';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';

export abstract class BaseElastic implements IBaseElasticServices {
	protected abstract indexMapping: MappingTypeMapping;
	protected abstract indexName: string;
	protected customRequestConfig: CustomRequestConfig;
	protected settings: IndicesIndexSettings = {
		number_of_shards: 1,
		number_of_replicas: 1,
	};

	constructor() {
		const username = process.env.ELS_USR ?? '';
		const password = process.env.ELS_PSS ?? '';
		const certificates = this.readCertificates();
		if (username === '' || password === '' || certificates === '') {
			throw new Error(
				'[Elastic Client] : Username or password or certificates are empty string'
			);
		}
		this.customRequestConfig = new CustomRequestConfig({
			auth: { password: password, username: username },
			validateStatus: (status: number) => {
				return true;
			},
			httpsAgent: new https.Agent({
				ca: certificates,
			}),
			baseURL: 'https://127.0.0.1:9200',
		});
	}

	private readCertificates() {
		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);
		return fs.readFileSync(certificatePath, 'utf8');
	}

	/**
	 * General HTTPS RESTful Request to Elastic.
	 * If a response returns failure (200 < R or R > 299) then an error will be thrown.
	 * @param axiosRequestConfig the configuration for an Elastic https request using Axios.
	 * @param callerName the name of the function that uses this service.
	 * @returns an object of the type 'T'.
	 */
	private async makeElasticRequest<R, C extends AxiosRequestConfig>(
		axiosRequestConfig: C,
		callerName: string
	) {
		const axiosResponse = await axios.request<C, AxiosResponse<R, C>>(axiosRequestConfig);
		const data = axiosResponse.data;

		//TODO: Think about creating a specific custom error.
		if (axiosResponse.status > 299 || axiosResponse.status < 200) {
			console.error('Error response: ', data);
			throw new Error(
				`[Base Elastic][${callerName}][Index: ${this.indexName}][Response-Status: ${axiosResponse.status}]`
			);
		}

		return {
			status: axiosResponse.status ?? -1,
			statusText: axiosResponse.statusText ?? 'Nothing',
			data: axiosResponse.data ?? null,
		};
	}

	async searchIndex<RE extends IElasticSearchResponse>(query: any) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.url = `/${this.indexName}/_search`;
		axiosRequestConfig.method = 'GET';
		axiosRequestConfig.data = query;

		const elasticResponse = await this.makeElasticRequest<RE, AxiosRequestConfig>(
			axiosRequestConfig,
			'Search Index'
		);

		return {
			hitsAmount: elasticResponse.data?.hits?.total?.value ?? 0,
			data: elasticResponse.data,
		};
	}

	async bulkAdd(bulkedDocuments: any) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.url = '_bulk';
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.data = bulkedDocuments;
		axiosRequestConfig['headers'] = { 'Content-Type': 'application/x-ndjson' };

		const elasticResponse = await this.makeElasticRequest<
			IElasticBulkResponse,
			AxiosRequestConfig
		>(axiosRequestConfig, 'Bulk Add');
		return elasticResponse;
	}

	async pingIndex() {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'HEAD';
		axiosRequestConfig.url = this.indexName;

		const elasticResponse = await this.makeElasticRequest(axiosRequestConfig, 'Ping Index');
		return elasticResponse.status;
	}

	async deleteIndex() {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'DELETE';
		axiosRequestConfig.url = this.indexName;

		const elasticResponse = await this.makeElasticRequest<
			IElasticDeleteResponse,
			AxiosRequestConfig
		>(axiosRequestConfig, 'Delete Index');

		return elasticResponse.data?.acknowledged;
	}

	async createIndex() {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'PUT';
		axiosRequestConfig.url = this.indexName;

		const elasticResponse = await this.makeElasticRequest<
			IElasticCreateIndexResponse,
			AxiosRequestConfig
		>(axiosRequestConfig, 'Create Index');

		return elasticResponse.data?.acknowledged;
	}

	async addUpdateRecord(documentId: number, record: any) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.url = `/${this.indexName}/_doc/${documentId}`;
		axiosRequestConfig.data = record;

		const elasticResponse = await this.makeElasticRequest<
			IElasticCrUpRecordResponse,
			AxiosRequestConfig
		>(axiosRequestConfig, 'Add Update Record');

		const data = elasticResponse.data;

		return {
			status: elasticResponse.status ?? -1,
			statusText: elasticResponse.statusText ?? ' No status text',
			data: data,
		};
	}

	async deleteRecordsByQ(query: any) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.url = `/${this.indexName}/_delete_by_query`;
		axiosRequestConfig.data = { query: query };

		const elasticResponse = await this.makeElasticRequest<
			IElasticDeleteByQResponse,
			AxiosRequestConfig
		>(axiosRequestConfig, 'Delete Records');

		const data = elasticResponse.data;

		return {
			status: elasticResponse.status ?? -1,
			statusText: elasticResponse.statusText ?? ' No status text',
			data: data,
		};
	}

	async updateRecordByQ(query: any, script: any) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = 'POST';
		axiosRequestConfig.url = `/${this.indexName}/_update_by_query`;
		axiosRequestConfig.data = {
			query: query,
			script: script,
		};

		const elasticResponse = await this.makeElasticRequest<
			IElasticUpdateByQResponse,
			AxiosRequestConfig
		>(axiosRequestConfig, 'Delete Records');

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

// ##############################################
// ### Services #################################
// ##############################################

interface IBaseElasticServices {
	searchIndex: <RE extends IElasticSearchResponse>(
		query: any
	) => Promise<{
		hitsAmount: number;
		data: RE | null;
	}>;
	bulkAdd: (bulkedDocuments: any) => Promise<{
		status: number;
		statusText: string;
		data: IElasticBulkResponse | null;
	}>;
	pingIndex: () => Promise<number>;
	deleteIndex: () => Promise<boolean | undefined>;
	createIndex: () => Promise<boolean | undefined>;
	addUpdateRecord: (
		documentId: number,
		record: any
	) => Promise<{
		status: number;
		statusText: string;
		data: IElasticCrUpRecordResponse | null;
	}>;
	deleteRecordsByQ: (query: any) => Promise<{
		status: number;
		statusText: string;
		data: IElasticDeleteByQResponse | null;
	}>;
	updateRecordByQ: (
		query: any,
		script: any
	) => Promise<{
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
	result: string;
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
	constructor(axiosRequestConfig: AxiosRequestConfig) {
		this.axiosRequestConfig = axiosRequestConfig;
	}
	getConfig() {
		return { ...this.axiosRequestConfig } as AxiosRequestConfig;
	}
}
