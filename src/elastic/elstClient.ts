import { Client, NodeOptions } from '@elastic/elasticsearch';
import { ElasticMalfunctionError } from '../errors/elst-malfunction-error';
import {
	BulkResponse,
	IndicesCreateResponse,
	IndicesIndexSettings,
	MappingTypeMapping,
	QueryDslQueryContainer,
} from '@elastic/elasticsearch/lib/api/types';
import { BulkAddError, IBulkError } from '../errors/bulk-edit-error';
import { IDocumentBranch } from '../common/interfaces/document-branch-interface';
import { ITimeSlotsDocument } from '../common/interfaces/timeslots-document-interface';

/*
	This encapsulates all the logic that connected to Elasticsearch requests,
	Implements needed CRUD operations on the 'all-branches' and 'appointments' indices.
*/
export class ElasticClient {
	//
	// This will be used to send requests to Elasticsearch.
	private client: Client | null = null;

	// Hardcoded indices.
	private branchesIndex: string = 'all-post-branches';
	private slotsIndex: string = 'open-slots';

	// Hardcoded branches mapping.
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
		},
	};

	// Hardcoded time slots mapping.
	private timeSlotsMapping: MappingTypeMapping = {
		dynamic: 'strict',
		properties: {
			id: { type: 'text' },
			calendarDate: { type: 'date', format: "yyyy-MM-dd'T'HH:mm:ss" },
			time: { type: 'integer' },
		},
	};

	// Hardcoded settings.
	private settings: IndicesIndexSettings = {
		number_of_shards: 1,
		number_of_replicas: 1,
	};

	// Construct client.
	constructor(
		node: string | string[] | NodeOptions | NodeOptions[],
		username: string,
		password: string,
		caCertificate: string,
		rejectUnauthorized: boolean
	) {
		this.client = new Client({
			node: node,
			auth: {
				username: username || 'elastic',
				password: password,
			},
			tls: {
				ca: caCertificate,
				rejectUnauthorized: rejectUnauthorized,
			},
		});
	}

	async sendPing() {
		try {
			await this.client?.ping();
			console.log('### Elasticsearch is up ###');
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError('sendPing failed');
		}
	}

	private async createIndex(
		indexName: string,
		settings: IndicesIndexSettings,
		mappings: MappingTypeMapping
	) {
		try {
			const result = await this.client?.indices.create({
				index: indexName,
				body: {
					settings,
					mappings,
				},
			});
			return result || false;
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError(`createIndex failed: ${indexName}`);
		}
	}

	private async indexExists(index: string) {
		try {
			const response = await this.client?.indices.exists({ index: index });
			return response || false;
		} catch (error) {
			throw new ElasticMalfunctionError(`indexExists failed: ${index}`);
		}
	}

	async allBranchesIndexExists() {
		return await this.indexExists(this.branchesIndex);
	}

	async timeSlotsIndexExists() {
		return await this.indexExists(this.branchesIndex);
	}

	async createAllBranchesIndex() {
		if (await this.allBranchesIndexExists()) {
			return false;
		}

		let response: IndicesCreateResponse | false;
		try {
			response = await this.createIndex(
				this.branchesIndex,
				this.settings,
				this.branchesMapping
			);
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError('createAllBranchesIndex failed creation');
		}

		if (!response || !response.acknowledged) {
			throw new ElasticMalfunctionError('createAllBranchesIndex response failure');
		}

		return true;
	}

	async createTimeSlotsIndex() {
		if (await this.timeSlotsIndexExists()) {
			return false;
		}

		let response: IndicesCreateResponse | false;
		try {
			response = await this.createIndex(
				this.slotsIndex,
				this.settings,
				this.timeSlotsMapping
			);
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError('createTimeSlotsIndex failed creation');
		}

		if (!response || !response.acknowledged) {
			throw new ElasticMalfunctionError('createTimeSlotsIndex response failure');
		}

		return true;
	}

	async deleteAllIndices() {
		try {
			const response = await this.client?.indices.getAlias({ index: '*' });
			if (!response) return false;
			for (const ind in response) {
				if (ind !== '.security-7') {
					const response = await this.client?.indices.delete({ index: ind });
					console.log(`Index '${ind}' has been deleted: `, response);
				}
			}
			return true;
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError('deleteAllIndices failed deletion');
		}
	}

	async addBranch(document: IDocumentBranch) {
		try {
			await this.client?.index({
				index: this.branchesIndex,
				document: document,
			});
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError(`addBranch failed: ${document}`);
		}
	}

	async getAllBranches() {
		try {
			const response = await this.client?.search({
				index: this.branchesIndex,
				query: {
					match_all: {},
				},
			});
			if (response) return response;
			throw new ElasticMalfunctionError('getAllBranches failed fetch');
		} catch (error) {
			console.error((error as Error).message);
			throw new ElasticMalfunctionError('getAllBranches failed fetch');
		}
	}

	async bulkAddBranches(addBranches: IDocumentBranch[]) {
		const body = addBranches.flatMap((object) => [
			{ index: { _index: this.branchesIndex } },
			object,
		]);

		let response: BulkResponse | undefined;

		try {
			response = await this.client?.bulk({ body });
			console.log('### bulkAddBranches has error ### : ', response?.errors);
			if (!response) {
				throw new ElasticMalfunctionError('Bulk add has failed');
			}
		} catch (error) {
			console.error(error);
			throw new ElasticMalfunctionError((error as Error).message);
		}

		if (response.errors) {
			const errors: IBulkError[] = [];
			for (const item of response.items) {
				errors.push({
					message: String(item.index?.error?.reason || ''),
					source: String(item.index?.error?.caused_by || ''),
				});
			}
			throw new BulkAddError(errors);
		}

		return response?.items;
	}

	// { index: { _index: this.slotsIndex } }

	async bulkAddSlots(addTimeSlots: ITimeSlotsDocument[]) {
		const body = addTimeSlots.flatMap((document) =>
			document.timeSlots.map((timeSlot) => ({
				index: { _index: this.slotsIndex },
				branchKey: document.branchKey,
				BranchDate: document.BranchDate,
				Time: timeSlot.Time,
			}))
		);

		let response: BulkResponse | undefined;

		try {
			response = await this.client?.bulk({ body });
			console.log('### bulkAddBranches has error ### : ', response?.errors);
			if (!response) {
				throw new ElasticMalfunctionError('Bulk add has failed');
			}
		} catch (error) {
			console.error(error);
			throw new ElasticMalfunctionError((error as Error).message);
		}

		if (response.errors) {
			const errors: IBulkError[] = [];
			for (const item of response.items) {
				errors.push({
					message: String(item.index?.error?.reason || ''),
					source: String(item.index?.error?.caused_by || ''),
				});
			}
			throw new BulkAddError(errors);
		}

		return response?.items;
	}

	async TEST_BranchSpatialIndexing(latitude: number, longitude: number) {
		const distance = '1km'; // Distance in kilometers

		/* ############################################################ */
		/* ### Queries ################################################ */
		/* ############################################################ */

		const spatialQuery: QueryDslQueryContainer = {
			geo_distance: {
				distance: distance,
				location: {
					lat: latitude,
					lon: longitude,
				},
			},
		};

		const flatQuery: QueryDslQueryContainer = {
			match: {
				cityEN: 'Zohar',
			},
		};

		/*
		//* 'Complex' strings.
		const queryStringQuery: QueryDslQueryContainer = {
			query_string: {
				default_field: 'cityEN',
				query: 'Zohar',
			},
		};

		//* Strings.
		const matchQuery: QueryDslQueryContainer = {
			match: {
				cityEN: 'Zohar',
			},
		};

		//* Exact match or bust, good foe keyword type and numbers.
		const termQuery: QueryDslQueryContainer = {
			term: {
				cityEN: 'Zohar',
			},
		};
		*/

		try {
			/* ############################################################ */
			/* ### Make Queries ########################################### */
			/* ############################################################ */

			const spatialResponse = await this.client?.search({
				index: this.branchesIndex,
				query: spatialQuery,
				size: 330,
				explain: true,
			});

			const flatResponse = await this.client?.search({
				index: this.branchesIndex,
				query: flatQuery,
				size: 330,
				explain: true,
			});

			/* ############################################################ */
			/* ### Log Query Result ####################################### */
			/* ############################################################ */

			console.log('spatialResponse?.hits : ', spatialResponse?.hits);
			console.log('flatResponse?.hits : ', flatResponse?.hits);

			spatialResponse?.hits.hits.forEach((hit) =>
				console.log('spatialResponse hit: ', hit)
			);

			flatResponse?.hits.hits.forEach((hit) =>
				console.log('flatResponse hit: ', hit)
			);

			const spatialExecutionTime = spatialResponse?.took;
			const flatExecutionTime = flatResponse?.took;

			console.log('Spatial Query Execution Time:', spatialExecutionTime, 'ms');
			console.log('Flat Query Execution Time:', flatExecutionTime, 'ms');
		} catch (error) {
			console.error('Error:', error);
		}
	}
}
