import { Client, NodeOptions } from '@elastic/elasticsearch';
import { ElasticMalfunctionError } from '../errors/elst-malfunction-error';
import {
	IndicesIndexSettings,
	MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';

interface IBranchDocument {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string;
	openstatus: number;
	displaystatus: number;
	branchtype: number;
	telephone: string;
	fax: string;
	manager: string;
	qnomycode: number;
	haszimuntor: number;
	qnomyWaitTimeCode: number;
	region: number;
	area: number;
	sector: number;
	city: string;
	cityEN: string;
	citycode: string;
	street: string;
	streetEN: string;
	streetcode: string;
	house: number;
	zip: string;
	addressdesc: string;
	addressdescEN: string;
	geocode_latitude: number;
	geocode_longitude: number;
	location: {
		lat: number;
		lon: number;
	};
	createdDate: Date;
	closedDate: Date;
	Services: {
		serviceid: number;
	}[];
	ExtraServices: {
		extraserviceid: number;
	}[];
	accessibility: {
		accessiblitytypeid: number;
		value: number;
	}[];
	hours: {
		dayofweek: number;
		openhour1: string;
		closehour1: string;
		openhour2: string;
		closehour2: string;
	}[];
	temphours: {
		messageid: number;
		dayofweek: number;
		openhour1: string;
		closehour1: string;
		openhour2: string;
		closehour2: string;
		validdate: Date;
		description: string;
	}[];
	messages: {
		id: number;
		title: string;
		text: string;
		validfromdate: Date;
		validtodate: Date;
		displayfromdate: Date;
		displaytodate: Date;
	}[];
	showProductInventories: boolean;
	isMakeAppointment: boolean;
	generalMessage: string;
}

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

	// Hardcoded mapping.
	private branchesMapping: MappingTypeMapping = {
		dynamic: 'strict',
		properties: {
			id: { type: 'integer' },
			branchnumber: { type: 'integer' },
			branchname: { type: 'text' },
			branchnameEN: { type: 'text' },
			openstatus: { type: 'integer' },
			displaystatus: { type: 'integer' },
			branchtype: { type: 'integer' },
			telephone: { type: 'text' },
			fax: { type: 'text' },
			manager: { type: 'text' },
			qnomycode: { type: 'integer' },
			haszimuntor: { type: 'integer' },
			qnomyWaitTimeCode: { type: 'integer' },
			region: { type: 'integer' },
			area: { type: 'integer' },
			sector: { type: 'integer' },
			city: { type: 'text' },
			cityEN: { type: 'text' },
			citycode: { type: 'text' },
			street: { type: 'text' },
			streetEN: { type: 'text' },
			streetcode: { type: 'text' },
			house: { type: 'integer' },
			zip: { type: 'text' },
			addressdesc: { type: 'text' },
			addressdescEN: { type: 'text' },
			geocode_latitude: { type: 'float' },
			geocode_longitude: { type: 'float' },
			location: {
				type: 'geo_point',
			},
			createdDate: { type: 'date' },
			closedDate: { type: 'date' },
			Services: {
				type: 'nested',
				properties: {
					serviceid: { type: 'integer' },
				},
			},
			ExtraServices: {
				type: 'nested',
				properties: {
					extraserviceid: { type: 'integer' },
				},
			},
			accessibility: {
				type: 'nested',
				properties: {
					accessiblitytypeid: { type: 'integer' },
					value: { type: 'integer' },
				},
			},
			hours: {
				type: 'nested',
				properties: {
					dayofweek: { type: 'integer' },
					openhour1: { type: 'text' },
					closehour1: { type: 'text' },
					openhour2: { type: 'text' },
					closehour2: { type: 'text' },
				},
			},
			temphours: {
				type: 'nested',
				properties: {
					messageid: { type: 'integer' },
					dayofweek: { type: 'integer' },
					openhour1: { type: 'text' },
					closehour1: { type: 'text' },
					openhour2: { type: 'text' },
					closehour2: { type: 'text' },
					validdate: {
						type: 'date',
						format: 'strict_date_optional_time||epoch_millis',
					},
					description: { type: 'text' },
				},
			},
			messages: {
				type: 'nested',
				properties: {
					id: { type: 'integer' },
					title: { type: 'text' },
					text: { type: 'text' },
					validfromdate: {
						type: 'date',
						format: 'strict_date_optional_time||epoch_millis',
					},
					validtodate: {
						type: 'date',
						format: 'strict_date_optional_time||epoch_millis',
					},
					displayfromdate: {
						type: 'date',
						format: 'strict_date_optional_time||epoch_millis',
					},
					displaytodate: {
						type: 'date',
						format: 'strict_date_optional_time||epoch_millis',
					},
				},
			},
			showProductInventories: { type: 'boolean' },
			isMakeAppointment: { type: 'boolean' },
			generalMessage: { type: 'text' },
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

		/*
            Test connection using defined client.
            If connection fails, Throws an error.
        */
		this.sendPing();
	}

	async sendPing() {
		try {
			await this.client?.ping();
			console.log('### Elasticsearch is up ###');
		} catch (error) {
			throw new ElasticMalfunctionError((error as Error).message);
		}
	}

	private async createIndex(
		indexName: string,
		settings: IndicesIndexSettings,
		mappings: MappingTypeMapping
	) {
		const result = await this.client?.indices.create({
			index: indexName,
			body: {
				settings,
				mappings,
			},
		});

		return result;
	}

	async createAllBranchesIndex() {
		if (await this.checkIndexExists(this.branchesIndex)) {
			return false;
		}

		const response = await this.createIndex(
			this.branchesIndex,
			this.settings,
			this.branchesMapping
		);
		console.log(response);
		if (!response?.acknowledged) {
			throw new ElasticMalfunctionError('Could not create Index');
		}
		return true;
	}

	private async checkIndexExists(indexName: string) {
		const response = await this.client?.indices.exists({ index: indexName });
		return response;
	}

	async deleteAllIndices() {
		const response = await this.client?.indices.getAlias({ index: '*' });
		if (!response) return false;
		for (const ind in response) {
			if (ind !== '.security-7') {
				const response = await this.client?.indices.delete({ index: ind });
				console.log(`Index '${ind}' has been deleted: `, response);
			}
		}
		return true;
	}

	async addBranch(document: IBranchDocument) {
		const response = await this.client?.index({
			index: this.branchesIndex,
			document: document,
		});

		return response;
	}

	private async getDocument() {
		const result = await this.client?.get({
			index: 'myindex',
			id: '1',
		});
		console.log(result);
	}

	async bulkAddBranches(addBranches: IBranchDocument[]) {
		const body = addBranches.flatMap((object) => [
			{ index: { _index: this.branchesIndex } },
			object,
		]);

		try {
			const response = await this.client?.bulk({ body });
			console.log(response);
			if (response?.items) {
				for (const obj of response?.items) {
					if (obj.index?.error) {
						console.log(obj);
						console.log(obj.index.error.caused_by);
					}
				}
			}
		} catch (error) {
			console.error(error);
			throw new ElasticMalfunctionError((error as Error).message);
		}
	}
}

export { IBranchDocument };
