import { Client, ClientOptions } from '@elastic/elasticsearch';
import {
	BulkOperationType,
	BulkResponseItem,
	IndicesIndexSettings,
	MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';
import path from 'path';
import fs from 'fs';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';

export abstract class BaseElastic {
	protected abstract indexMapping: MappingTypeMapping;
	protected abstract indexName: string;
	protected axiosRequestConfig: AxiosRequestConfig;
	protected client: Client | null = null;
	protected settings: IndicesIndexSettings = {
		number_of_shards: 1,
		number_of_replicas: 1,
	};
	protected node = 'https://127.0.0.1:9200';

	constructor() {
		let useOptions: ClientOptions = {};
		const username = process.env.ELS_USR ?? '';
		const password = process.env.ELS_PSS ?? '';
		const certificates = this.readCertificates();
		if (username === '' || password === '' || certificates === '') {
			throw new Error(
				'[Elastic Client] : Username or password or certificates are empty string'
			);
		}
		this.axiosRequestConfig = {
			auth: { password: password, username: username },
			validateStatus: (status: number) => {
				return true;
			},
			httpsAgent: new https.Agent({
				ca: certificates,
			}),
		};
	}

	private readCertificates() {
		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);
		return fs.readFileSync(certificatePath, 'utf8');
	}

	protected async searchIndex<RE extends IElasticResponseData, CO extends AxiosRequestConfig>(
		query: any
	) {
		const result = {
			status: 'No status',
			statusText: 'No status text',
			hitsAmount: 0,
			data: [],
		};
		try {
			this.axiosRequestConfig.baseURL = `${this.node}/${this.indexName}/_search`;
			this.axiosRequestConfig.method = 'GET';
			this.axiosRequestConfig.data = query;

			const axiosResponse = await axios.request<CO, AxiosResponse<RE, CO>>(
				this.axiosRequestConfig
			);
			const data = axiosResponse.data;

			const result = {
				status: axiosResponse.status ?? 'No status',
				statusText: axiosResponse.statusText ?? ' No status text',
				hitsAmount: data?.hits?.total?.value ?? 0,
				data: data,
			};

			return result;
		} catch (error) {
			console.error('Error:', error);
			return null;
		}
	}
}

export interface IElasticResponseData {
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
