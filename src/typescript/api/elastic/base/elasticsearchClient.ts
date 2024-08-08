import { MappingTypeMapping } from "@elastic/elasticsearch/lib/api/types";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as https from "https";

import { ELASTIC_BASE_URL } from "../../../shared/constants/ApiEndpoints";
import { getAuthenticationData, omit } from "./ElasticsearchUtils";
import { ILogger, WinstonClient } from "../../../shared/classes/WinstonClient";
import { PathStack } from "../../../shared/classes/PathStack";
import { ErrorSource, ServiceError } from "../../../errors/ServiceError";

// ###################################################################################################
// ### Singleton ElasticsearchClient #################################################################
// ###################################################################################################

export class ElasticsearchClient implements IElasticsearchClient {
	private static instance: ElasticsearchClient;
	private customRequestConfig: CustomRequestConfig;
	private logger: ILogger;
	private pathStack: PathStack;

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

		this.pathStack = new PathStack().push("Elasticsearch Client");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
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
		const { axiosRequestConfig } = requestData;
		this.pathStack.push("Make Elastic Request");
		try {
			const axiosResponse = await axios.request<
				AxiosRequestConfig,
				AxiosResponse<R, AxiosRequestConfig>
			>(axiosRequestConfig);
			axiosResponse.request;

			return omit(axiosResponse, "request", "config");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.code === "ECONNREFUSED") {
					throw new ServiceError({
						logger: this.logger,
						source: ErrorSource.Database,
						message: `${requestData.callerName} ECONNREFUSED`,
						details: {
							errorCode: error.code,
							baseUrl: error.config?.baseURL,
							url: error.config?.url,
						},
					});
				}
			}
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Internal,
				message: (error as Error).message,
				details: {
					name: (error as Error).name,
					stack: (error as Error).stack,
				},
			});
		}
	}

	async pingIndex(requestData: { indexName: string }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "HEAD";
		axiosRequestConfig.url = requestData.indexName;

		const elasticResponse = await this.makeElasticRequest({
			axiosRequestConfig,
			callerName: "Ping Index",
			indexName: requestData.indexName,
			checkStatus: false,
		});

		return elasticResponse;
	}

	async searchIndex<R extends IElasticSearchResponse>(requestData: {
		indexName: string;
		request: any;
	}) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.url = `/${requestData.indexName}/_search`;
		axiosRequestConfig.method = "GET";
		axiosRequestConfig.data = requestData.request;

		return await this.makeElasticRequest<R>({
			axiosRequestConfig,
			callerName: "Search Index",
			indexName: requestData.indexName,
		});
	}

	async deleteIndex(requestData: { indexName: string }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "DELETE";
		axiosRequestConfig.url = requestData.indexName;

		return await this.makeElasticRequest<IElasticDeleteResponse>({
			axiosRequestConfig,
			callerName: "Delete Index",
			indexName: requestData.indexName,
		});
	}

	async createIndex(requestData: {
		indexName: string;
		indexMapping: MappingTypeMapping;
	}) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "PUT";
		axiosRequestConfig.url = requestData.indexName;
		axiosRequestConfig.data = { mappings: requestData.indexMapping };

		return await this.makeElasticRequest<IElasticCreateIndexResponse>({
			axiosRequestConfig,
			callerName: "Create Index",
			indexName: requestData.indexName,
		});
	}

	async getIndexMapping(requestData: { indexName: string }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "GET";
		axiosRequestConfig.url = `${requestData.indexName}/_mapping`;

		return await this.makeElasticRequest<MappingTypeMapping>({
			axiosRequestConfig,
			callerName: "Get Index Mapping",
			indexName: requestData.indexName,
		});
	}

	async addUpdateRecord(requestData: {
		indexName: string;
		documentId: number;
		record: any;
	}) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "POST";
		axiosRequestConfig.url = `/${requestData.indexName}/_doc/${requestData.documentId}`;
		axiosRequestConfig.data = requestData.record;

		return await this.makeElasticRequest<IElasticCrUpRecordResponse>({
			axiosRequestConfig,
			callerName: "Add Update Record",
			indexName: requestData.indexName,
		});
	}

	async bulkAdd(requestData: { indexName: string; bulkedDocuments: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.url = "_bulk";
		axiosRequestConfig.method = "POST";
		axiosRequestConfig.data = requestData.bulkedDocuments;
		axiosRequestConfig["headers"] = { "Content-Type": "application/x-ndjson" };

		return await this.makeElasticRequest<IElasticBulkResponse>({
			axiosRequestConfig,
			callerName: "Bulk Add",
			indexName: requestData.indexName,
		});
	}

	async deleteRecordsByQ(requestData: { indexName: string; request: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "POST";
		axiosRequestConfig.url = `/${requestData.indexName}/_delete_by_query`;
		axiosRequestConfig.data = requestData.request;

		return await this.makeElasticRequest<IElasticDeleteByQResponse>({
			axiosRequestConfig,
			callerName: "Delete Records",
			indexName: requestData.indexName,
		});
	}

	async updateRecordByQ(requestData: { indexName: string; request: any }) {
		const axiosRequestConfig = this.customRequestConfig.getConfig();
		axiosRequestConfig.method = "POST";
		axiosRequestConfig.url = `/${requestData.indexName}/_update_by_query`;
		axiosRequestConfig.data = requestData.request;

		return await this.makeElasticRequest<IElasticUpdateByQResponse>({
			axiosRequestConfig,
			callerName: "Update Record By request",
			indexName: requestData.indexName,
		});
	}
}

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IElasticsearchClient {
	pingIndex(requestData: {
		indexName: string;
	}): Promise<Omit<AxiosResponse, "request" | "config">>;

	searchIndex<R extends IElasticSearchResponse>(requestData: {
		indexName: string;
		request: any;
	}): Promise<Omit<AxiosResponse<R>, "request" | "config">>;

	deleteIndex(requestData: {
		indexName: string;
	}): Promise<
		Omit<AxiosResponse<IElasticDeleteResponse>, "request" | "config">
	>;

	createIndex(requestData: {
		indexName: string;
		indexMapping: MappingTypeMapping;
	}): Promise<
		Omit<AxiosResponse<IElasticCreateIndexResponse>, "request" | "config">
	>;

	getIndexMapping(requestData: {
		indexName: string;
	}): Promise<Omit<AxiosResponse<MappingTypeMapping>, "request" | "config">>;

	addUpdateRecord(requestData: {
		indexName: string;
		documentId: number;
		record: any;
	}): Promise<
		Omit<AxiosResponse<IElasticCrUpRecordResponse>, "request" | "config">
	>;

	bulkAdd(requestData: {
		indexName: string;
		bulkedDocuments: any;
	}): Promise<Omit<AxiosResponse<IElasticBulkResponse>, "request" | "config">>;

	deleteRecordsByQ(requestData: {
		indexName: string;
		request: any;
	}): Promise<
		Omit<AxiosResponse<IElasticDeleteByQResponse>, "request" | "config">
	>;

	updateRecordByQ(requestData: {
		indexName: string;
		request: any;
	}): Promise<
		Omit<AxiosResponse<IElasticUpdateByQResponse>, "request" | "config">
	>;
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
	result: "created" | "updated";
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
