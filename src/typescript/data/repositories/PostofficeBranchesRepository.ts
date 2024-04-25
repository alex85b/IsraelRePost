import {
	BranchServicesIndexing,
	IBranchServicesIndexing,
} from '../../api/elastic/branchServices/BranchServicesIndexing';
import {
	BulkCreateUpdateResponse,
	IBulkCreateUpdateResponse,
} from '../models/dataTransferModels/elasticResponses/BulkCreateUpdateResponse';
import {
	IPostofficeBranchRecord,
	useSingleBranchQueryResponse,
} from '../models/persistenceModels/PostofficeBranchRecord';

export interface IPostofficeBranchesRepository {
	getAllBranches(): Promise<IPostofficeBranchRecord[]>;
	deleteWriteBranches(
		branchRecords: IPostofficeBranchRecord[]
	): Promise<IBulkCreateUpdateResponse>;
	writeUpdateBranches(
		branchRecords: IPostofficeBranchRecord[]
	): Promise<IBulkCreateUpdateResponse>;
}

export class PostofficeBranchesRepository implements IPostofficeBranchesRepository {
	private branches: IBranchServicesIndexing;

	constructor() {
		this.branches = new BranchServicesIndexing();
	}

	async getAllBranches() {
		const rawResponse = await this.branches.fetchAllBranches({ maxRecords: 500 });
		const { data, status, statusText } = rawResponse;
		if (status < 200 || status > 299) {
			throw Error(
				`[Postoffice Branches Repository][Get All Branches] Error${status} : ${
					statusText ?? 'No status text'
				}`
			);
		}

		const rawQueryResult = data?.hits?.hits;
		if (!Array.isArray(rawQueryResult)) {
			throw Error(
				`[Postoffice Branches Repository][Get All Branches] Query result is not array`
			);
		}

		const branchRecords: IPostofficeBranchRecord[] = rawQueryResult.map((branchQuery) => {
			try {
				return useSingleBranchQueryResponse({ rawQueryResponse: branchQuery }).build();
			} catch (error) {
				throw Error(`Branch ${branchQuery._id} : ` + (error as Error).message);
			}
		});

		return branchRecords;
	}

	getBranchByID() {}

	writeUpdateBranch() {}

	async writeUpdateBranches(branchRecords: IPostofficeBranchRecord[]) {
		const rawBulkAddResponse = await this.branches.bulkAddBranches({
			addBranches: branchRecords.map((branchRecord) => branchRecord.getBranchDocumentCopy()),
		});
		const bulkAddResponse: IBulkCreateUpdateResponse = new BulkCreateUpdateResponse.Builder()
			.useAxiosResponse(rawBulkAddResponse)
			.build();
		return bulkAddResponse;
	}

	async deleteWriteBranches(branchRecords: IPostofficeBranchRecord[]) {
		const deleteResponse = await this.branches.deleteAllBranches();
		if (deleteResponse.status > 299 || deleteResponse.status < 200)
			throw Error(
				'[deleteWriteBranches] delete branches failed : ' +
					JSON.stringify(deleteResponse, null, 3)
			);
		const rawBulkAddResponse = await this.branches.bulkAddBranches({
			addBranches: branchRecords.map((branchRecord) => branchRecord.getBranchDocumentCopy()),
		});
		const bulkAddResponse: IBulkCreateUpdateResponse = new BulkCreateUpdateResponse.Builder()
			.useAxiosResponse(rawBulkAddResponse)
			.build();
		return bulkAddResponse;
	}
}
