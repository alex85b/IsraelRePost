import { Client, ClientOptions } from '@elastic/elasticsearch';
import {
	BulkOperationType,
	BulkResponseItem,
	IndicesIndexSettings,
	MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';
import path from 'path';
import fs from 'fs';
import axios, { AxiosRequestConfig } from 'axios';
import * as https from 'https';

/*
	This encapsulates all the logic that connected to Elasticsearch requests,
	Implements needed CRUD operations.
*/

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface IErrorMapping {
	userError: string;
	services: IServiceError[];
}

export interface IServiceError {
	serviceId: string;
	serviceError: string;
	dates: IDateError[];
}

export interface IDateError {
	calendarId: string;
	datesError: string;
	timesError: string;
}

export interface INewServiceRecord {
	serviceId: string;
	serviceName: string;
	dates: INewDateEntryRecord[];
}

export interface INewDateEntryRecord {
	calendarId: string;
	calendarDate: string;
	hours: string[];
}

export interface IDocumentBranch {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string;
	city: string;
	cityEN: string;
	street: string;
	streetEN: string;
	streetcode: string;
	zip: string;
	qnomycode: number;
	qnomyWaitTimeCode: number;
	haszimuntor: number;
	isMakeAppointment: number;
	location: {
		lat: number;
		lon: number;
	};
	services: INewServiceRecord[];
}

export interface ISingleBranchQueryResponse {
	_index: string;
	_id: string;
	_score: number;
	_source: IDocumentBranch;
}

export interface IBranchQueryResponse extends Array<ISingleBranchQueryResponse> {}

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
		hits: ISingleBranchQueryResponse[];
	};
}

// ###################################################################################################
// ### Class: ElasticClient ##########################################################################
// ###################################################################################################

export class ElasticClient {
	// ###########################################################
	// ### Instance variables ####################################
	// ###########################################################
	private client: Client | null = null;
	private currentError: Error | null = null;
	private failReasons: string[] = [];
	private branchesIndexName: string = 'branches';
	private errorsIndexName: string = 'errors';
	private node = 'https://127.0.0.1:9200';
	private username = '';
	private password = '';
	private certificates = '';
	private branchesMapping: MappingTypeMapping = {
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

	private errorMapping: MappingTypeMapping = {
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

	// Hardcoded settings for any index.
	private settings: IndicesIndexSettings = {
		number_of_shards: 1,
		number_of_replicas: 1,
	};

	// ###########################################################
	// ### Methods ###############################################
	// ###########################################################

	constructor(clientOptions?: ClientOptions) {
		let useOptions: ClientOptions = {};
		this.username = process.env.ELS_USR ?? '';
		this.password = process.env.ELS_PSS ?? '';
		this.certificates = this.readCertificates();
		if (this.username === '' || this.password === '' || this.certificates === '') {
			throw new Error(
				'[Elastic Client] : Username or password or certificates are empty string'
			);
		}
		if (!clientOptions) {
			useOptions = {
				node: this.node,
				auth: {
					username: this.username,
					password: this.password,
				},
				tls: {
					ca: this.certificates,
					rejectUnauthorized: false,
				},
			};
		} else useOptions = clientOptions;
		this.client = new Client(useOptions);
	}

	// #####################
	// ### Private #########
	// #####################

	/**
	 * Creates an index - any index in Elasticsearch data base.
	 * If an error occurred, Instance variables will be populated
	 * with both an Error and string reason for said failure.
	 * @param param0 an Object that has the pairs: indexName-string,
	 * settings-IndicesIndexSettings, mappings: MappingTypeMapping.
	 * @returns a promise of boolean to indicate a success or failure,
	 * or a promise of null in case of an error.
	 */
	private async createIndex({
		indexName,
		settings,
		mappings,
	}: {
		indexName: string;
		settings: IndicesIndexSettings;
		mappings: MappingTypeMapping;
	}) {
		try {
			// Check if already exists.
			const indexExists = await this.isIndexExists({ indexName });
			if (indexExists === true) {
				this.failReasons.push(`the index ${indexName} already exists`);
				return true;
			}
			// Create the index.
			const response =
				(await this.client?.indices.create({
					index: indexName,
					body: {
						settings,
						mappings,
					},
				})) ?? null;
			const success = response?.acknowledged ?? false;
			return success;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push(`create index:${indexName} - failed unexpectedly`);
			return null;
		}
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

	private async isIndexExists({ indexName }: { indexName: string }) {
		try {
			return (await this.client?.indices.exists({ index: indexName })) ?? false;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push(`${indexName} existence check - failed unexpectedly`);
			return null;
		}
	}

	private async deleteIndex({ indexName }: { indexName: string }) {
		try {
			if (indexName === '.security-7') return false;
			const response = await this.client?.indices.delete({ index: indexName });
			if (response === undefined || response?.acknowledged === false) return false;
			return true;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push(`${indexName} deletion - failed unexpectedly`);
			return null;
		}
	}

	private async addSingleRecord({
		indexName,
		recordId,
		record,
	}: {
		indexName: string;
		recordId: string;
		record: Object;
	}) {
		try {
			const response =
				(await this.client?.index({
					index: indexName,
					id: recordId,
					document: record,
					op_type: 'index', // Explicitly set to "index" for overwrite behavior
				})) ?? null;
			return response?.result ?? null;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push(`Adding a record to ${indexName} index - failed unexpectedly`);
			return null;
		}
	}

	private async getAllIndexRecords({ indexName }: { indexName: string }) {
		try {
			const result =
				(await this.client?.search({
					index: indexName,
					query: {
						match_all: {},
					},
					size: 10000,
				})) ?? null;
			return result?.hits.hits as ISingleBranchQueryResponse[];
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push(
				`retrieve-all-records query from ${indexName} - failed unexpectedly`
			);
			return null;
		}
	}

	// #####################
	// ### Public ##########
	// #####################

	/**
	 * Attempts a connection with Elasticsearch database.
	 * If attempt fails, Instance variables will be populated
	 * 	with both an Error and string reason for said failure.
	 * @returns boolean indication of ping success.
	 */
	async sendPing() {
		try {
			await this.client?.ping();
			return true;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push('ping failed');
			return false;
		}
	}

	getLatestError() {
		const errors = JSON.parse(JSON.stringify(this.currentError)) as Error;
		this.currentError = null;
		return errors;
	}

	getAllFailReasons() {
		const reasons = JSON.parse(JSON.stringify(this.failReasons)) as string[];
		this.failReasons = [];
		return reasons;
	}

	async branchIndexExists() {
		return this.isIndexExists({ indexName: this.branchesIndexName });
	}

	async errorsIndexExists() {
		return this.isIndexExists({ indexName: this.errorsIndexName });
	}

	async createBranchesIndex() {
		return this.createIndex({
			indexName: this.branchesIndexName,
			mappings: this.branchesMapping,
			settings: this.settings,
		});
	}

	async createErrorsIndex() {
		return this.createIndex({
			indexName: this.errorsIndexName,
			mappings: this.errorMapping,
			settings: this.settings,
		});
	}

	/* //Find all indices
	const allIndices = 
	await this.client?.indices.getAlias({
		index: this.branchesIndexName});
	*/

	async deleteBranchesIndex() {
		return this.deleteIndex({ indexName: this.branchesIndexName });
	}

	async deleteErrorsIndex() {
		return this.deleteIndex({ indexName: this.errorsIndexName });
	}

	async addSingleBranch(branchDocument: IDocumentBranch) {
		const result = this.addSingleRecord({
			indexName: this.branchesIndexName,
			recordId: String(branchDocument.branchnumber),
			record: branchDocument,
		});
		if (result === null) {
			this.failReasons.push(
				`add single branch: ${branchDocument.branchnameEN} - failed unexpectedly`
			);
		}
		return result;
	}

	async addSingleError(errorDocument: IErrorMapping, branchIndex: string) {
		const result = await this.addSingleRecord({
			indexName: this.errorsIndexName,
			recordId: branchIndex,
			record: errorDocument,
		});
		if (result === null) {
			this.failReasons.push(
				`add single error-record of branch: ${branchIndex} - failed unexpectedly`
			);
		}
		return result;
	}

	async getAllBranchIndexRecords() {
		return this.getAllIndexRecords({ indexName: this.branchesIndexName });
	}

	async getAllErrorIndexRecords() {
		return this.getAllIndexRecords({ indexName: this.errorsIndexName });
	}

	async bulkAddBranches(addBranches: IDocumentBranch[]) {
		try {
			// Prepare the bulk request
			const bulkRequest: object[] = [];
			addBranches.forEach((branchDocument) => {
				bulkRequest.push(
					{
						index: {
							_index: this.branchesIndexName,
							_id: branchDocument.branchnumber.toString(),
						},
					},
					branchDocument
				);
			});
			// Request bulk write.
			const response = (await this.client?.bulk({ body: bulkRequest })) ?? null;

			if (response === null) {
				this.failReasons.push('no response given to bulkRequest');
				return null;
			}
			if (response.errors) {
				this.failReasons.push('bulk request has failed records');
				response.items.forEach((sResponse) => {
					if (sResponse.index?.error)
						this.failReasons.push(sResponse.index.error.reason ?? '');
				});
				return null;
			}
			return response.items;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push('Bulk Add Branches - failed unexpectedly');
			return null;
		}
	}

	async updateBranchServices(idPostBranch: string, services: INewServiceRecord[]) {
		try {
			const response =
				(await this.client?.updateByQuery({
					index: this.branchesIndexName,
					body: {
						query: {
							term: {
								_id: idPostBranch,
							},
						},
						script: {
							source: 'ctx._source.services = params.updatedServicesArray',
							lang: 'painless',
							params: {
								updatedServicesArray: services,
							},
						},
					},
				})) ?? null;

			const errors = response?.failures ?? [];
			const updates = response?.updated ?? 0;
			const success = errors.length === 0 && updates > 0;
			return success;
		} catch (error) {
			this.currentError = error as Error;
			this.failReasons.push('Update Branch-service By Query - failed unexpectedly');
			return null;
		}
	}

	async testAxios_search() {
		try {
			const action = '_search';
			const method = 'GET';
			const elasticQuery = {
				query: {
					match_all: {},
				},
				size: 500,
			};

			const axiosRequestConfig: AxiosRequestConfig = {
				baseURL: `${this.node}/${this.branchesIndexName}/${action}`,
				auth: { password: this.password, username: this.username },
				method: method,
				validateStatus: (status: number) => {
					return true;
				},
				httpsAgent: new https.Agent({
					ca: this.certificates,
				}),
			};
			const axiosResponse = await axios.request(axiosRequestConfig);
			const data: IElasticResponseData = axiosResponse.data;

			const result = {
				status: axiosResponse.status ?? 'No status',
				statusText: axiosResponse.statusText ?? ' No status text',
				hitsAmount: data?.hits?.total?.value ?? 0,
				hits: data?.hits?.hits ?? [],
			};

			return result;
		} catch (error) {
			console.error('Error:', error);
		}
	}

	private async generateError() {
		const badBranchDocument = {
			id: 1,
			branchnumber: 123,
			branchname: 'Branch 1',
			branchnameEN: 'Branch 1 (English)',
			city: 'City 1',
			cityEN: 'City 1 (English)',
			street: 'Street 1',
			streetEN: 'Street 1 (English)',
			streetcode: 'ABC123',
			zip: '12345',
			qnomycode: 456,
			qnomyWaitTimeCode: 789,
			haszimuntor: 1,
			isMakeAppointment: 0,
			location: {
				lat: 40.7128,
				lon: -74.006,
			},
			qweqwe: 123123,
			services: [],
		};
		return (await this.addSingleBranch(badBranchDocument)) ?? 'Null';
	}
}

// ###################################################################################################
// ### Errors ########################################################################################
// ###################################################################################################

// This is what postman shows me.
interface IPresumedErrorStructure {
	error: {
		root_cause: [
			{
				type: string;
				reason: string;
			}
		];
		type: string;
		reason: string;
	};
	status: string;
}

export interface IElasticErrorData {
	responseRecords?: {
		badBulkRecords: Partial<Record<BulkOperationType, BulkResponseItem>>[];
	};
	functionName: string;
	operation: string;
	manifestedError: Error | null;
}

/*
This should accommodate both cases:
1. an error has a single source. Example: addSingleError function.
2. an error has compound reasons. Example: bulkAddBranches function,
in this case some N records out of overall M records could report a failure.
*/
export class qwe extends Error {
	constructor(errorObject: IElasticErrorData) {
		super('Elastic has failed');
		Object.setPrototypeOf(this, qwe);
	}

	getReport() {
		const report = [];
	}
}
