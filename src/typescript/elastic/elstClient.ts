import { Client, NodeOptions } from "@elastic/elasticsearch";
import {
	BulkResponse,
	ErrorCause,
	IndicesCreateResponse,
	IndicesIndexSettings,
	IndicesResponseBase,
	MappingTypeMapping,
	SearchResponse,
	WriteResponseBase,
} from "@elastic/elasticsearch/lib/api/types";
import { IDocumentBranch } from "../interfaces/IDocumentBranch";

/*
	This encapsulates all the logic that connected to Elasticsearch requests,
	Implements needed CRUD operations.
*/

// ###################################################################################################
// ### Interfaces ####################################################################################
// ###################################################################################################

export interface ErrorMapping {
	userError: string;
	servicesErrors: ServiceError[];
	datesErrors: DateError[];
	timesError: string;
}

export interface ServiceError {
	serviceId: string;
	errorText: string;
}

export interface DateError {
	dateId: string;
	errorText: string;
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
	private branchesIndex: string = "branches";
	private branchesMapping: MappingTypeMapping = {
		dynamic: "strict",
		properties: {
			id: { type: "integer" },
			branchnumber: { type: "integer" },
			branchname: { type: "text" },
			branchnameEN: { type: "text" },
			city: { type: "text" },
			cityEN: { type: "text" },
			street: { type: "text" },
			streetEN: { type: "text" },
			streetcode: { type: "keyword" },
			zip: { type: "keyword" },
			qnomycode: { type: "integer" },
			qnomyWaitTimeCode: { type: "integer" },
			haszimuntor: { type: "integer" },
			isMakeAppointment: { type: "integer" },
			location: { type: "geo_point" },
			services: {
				type: "nested",
				properties: {
					serviceId: { type: "keyword" },
					serviceName: { type: "keyword" },
					dates: {
						type: "nested",
						properties: {
							calendarId: { type: "keyword" },
							calendarDate: { type: "date", format: "yyyy-MM-dd'T'HH:mm:ss" },
							hours: {
								type: "text",
								fields: {
									keyword: { type: "keyword" },
								},
							},
						},
					},
				},
			},
		},
	};

	private errorMapping: MappingTypeMapping = {
		dynamic: "strict",
		properties: {
			userError: { type: "text" }, // Long error text for user error
			servicesErrors: {
				type: "nested",
				properties: {
					serviceId: { type: "keyword" }, // Service ID
					errorText: { type: "text" }, // Long error text for the service
				},
			},
			datesErrors: {
				type: "nested",
				properties: {
					dateId: { type: "keyword" }, // Date ID associated with the error
					errorText: { type: "text" }, // Long error text for the date
				},
			},
			timesError: { type: "text" }, // Long error text for timesError
		},
	};

	// Hardcoded settings.
	private settings: IndicesIndexSettings = {
		number_of_shards: 1,
		number_of_replicas: 1,
	};

	// ###########################################################
	// ### Methods ###############################################
	// ###########################################################

	constructor({
		node,
		username,
		password,
		caCertificate,
		rejectUnauthorized,
	}: {
		node: string | string[] | NodeOptions | NodeOptions[];
		username: string;
		password: string;
		caCertificate: string;
		rejectUnauthorized: boolean;
	}) {
		this.client = new Client({
			node: node,
			auth: {
				username: username || "elastic",
				password: password,
			},
			tls: {
				ca: caCertificate,
				rejectUnauthorized: rejectUnauthorized,
			},
		});
	}

	async sendPing() {
		const result: {
			success: boolean;
			error: Error | null;
		} = {
			success: false,
			error: null,
		};
		try {
			await this.client?.ping();
			result.success = true;
			return result;
		} catch (error) {
			result.error = error as Error;
			return result;
		}
	}

	private async createIndex({
		indexName,
		settings,
		mappings,
	}: {
		indexName: string;
		settings: IndicesIndexSettings;
		mappings: MappingTypeMapping;
	}) {
		const result: {
			success: boolean;
			result: IndicesCreateResponse | null;
			error: Error | null;
		} = {
			success: false,
			result: null,
			error: null,
		};
		try {
			result.result =
				(await this.client?.indices.create({
					index: indexName,
					body: {
						settings,
						mappings,
					},
				})) ?? null;
			result.success = true;
			return result;
		} catch (error) {
			result.error = error as Error;
			return result;
		}
	}

	async branchIndexExists() {
		const result: {
			success: boolean;
			error: Error | null;
		} = {
			success: false,
			error: null,
		};
		try {
			result.success =
				(await this.client?.indices.exists({ index: this.branchesIndex })) ?? false;
			return result;
		} catch (error) {
			result.error = error as Error;
			return result;
		}
	}

	async createBranchesIndex() {
		const result: {
			success: boolean;
			reason: string;
			error: Error | null;
		} = {
			success: false,
			reason: "",
			error: null,
		};
		try {
			const existCheck = await this.branchIndexExists();
			if (existCheck.success) {
				result.success = true;
				result.reason = `${this.branchesIndex} already exist`;
				return result;
			}
			this.createIndex({
				indexName: this.branchesIndex,
				mappings: this.branchesMapping,
				settings: this.settings,
			});
			result.success = true;
			return result;
		} catch (error) {
			result.error = error as Error;
			return result;
		}
	}

	async deleteBranchesIndex() {
		const result: {
			success: boolean;
			reason: string[];
			response: IndicesResponseBase[];
			error: Error | null;
		} = {
			success: false,
			response: [],
			reason: [],
			error: null,
		};
		try {
			const allIndices = await this.client?.indices.getAlias({
				index: this.branchesIndex,
			});
			if (!allIndices) {
				result.success = true;
				result.reason.push("no indices found in the db");
				return result;
			}
			for (const ind in allIndices) {
				if (ind !== ".security-7") {
					const response = await this.client?.indices.delete({ index: ind });
					if (response) result.response.push(response);
					result.reason.push(`Index '${ind}' has been deleted: `);
				}
			}
			result.success = true;
			return result;
		} catch (error) {
			result.error = error as Error;
			return result;
		}
	}

	private async addSingleBranch({ branchDocument }: { branchDocument: IDocumentBranch }) {
		const result: {
			success: boolean;
			reason: string;
			addBranchResponse: WriteResponseBase | null;
			error: Error | null;
		} = {
			success: false,
			addBranchResponse: null,
			reason: "",
			error: null,
		};
		try {
			result.addBranchResponse =
				(await this.client?.create({
					index: this.branchesIndex,
					id: String(branchDocument.branchnumber),
					document: branchDocument,
				})) ?? null;
			return result;
		} catch (error) {
			result.error = error as Error;
			result.reason = "addSingleBranch failed unexpectedly";
			return result;
		}
	}

	async getAllBranchIndexRecords() {
		const result: {
			success: boolean;
			reason: string;
			response: SearchResponse | null;
			error: Error | null;
		} = {
			success: false,
			response: null,
			reason: "",
			error: null,
		};
		try {
			result.response =
				(await this.client?.search({
					index: this.branchesIndex,
					query: {
						match_all: {},
					},
					size: 2000,
				})) ?? null;
			result.success = true;
			return result;
		} catch (error) {
			result.error = error as Error;
			result.reason = "getAllBranches failed unexpectedly";
			return result;
		}
	}

	async bulkAddBranches(addBranches: IDocumentBranch[]) {
		const result: {
			success: boolean;
			reason: string;
			response: BulkResponse | null;
			failed: { reason: string; caused_by: string | ErrorCause }[];
			error: Error | null;
		} = {
			success: false,
			reason: "",
			response: null,
			failed: [],
			error: null,
		};

		try {
			// Prepare the bulk request
			const bulkRequest: object[] = [];
			addBranches.forEach((branchDocument) => {
				bulkRequest.push(
					{
						index: {
							_index: this.branchesIndex,
							_id: branchDocument.branchnumber.toString(),
						},
					},
					branchDocument
				);
			});
			// Request bulk write.
			result.response = (await this.client?.bulk({ body: bulkRequest })) ?? null;

			if (!result.response) {
				result.success = false;
				result.reason = "no response given to bulkRequest";
				return result;
			}
			if (result.response.errors) {
				result.success = false;
				result.reason = "bulk request has failed records";
				result.response.items.forEach((response) => {
					if (response.index?.error)
						result.failed.push({
							reason: response.index.error.reason ?? "",
							caused_by: response.index.error.caused_by ?? "",
						});
				});
				return result;
			}

			result.success = true;
			return result;
		} catch (error) {
			result.error = error as Error;
			result.reason = "bulkAddBranches failed unexpectedly";
			return result;
		}
	}
}
