import {
	BranchServicesIndexing,
	IBranchServicesIndexing,
} from '../../api/elastic/branchServices/BranchServicesIndexing';
import {
	BulkCreateUpdateResponse,
	IBulkCreateUpdateResponse,
} from '../models/dataTransferModels/elasticResponses/BulkCreateUpdateResponse';
import {
	IBranchIdQnomyCodePair,
	IPostofficeBranchIdCodePairBuilder,
	PostofficeBranchIdCodePairBuilder,
} from '../models/persistenceModels/PostofficeBranchIdCodePair';
import {
	IPostofficeBranchRecord,
	useSingleBranchQueryResponse,
} from '../models/persistenceModels/PostofficeBranchRecord';
import { IPostofficeBranchServices } from '../models/persistenceModels/PostofficeBranchServices';

export interface IPostofficeBranchesRepository {
	getAllBranches(): Promise<IPostofficeBranchRecord[]>;
	getAllBranchesExcluding(branchIdsToExclude: string[]): Promise<IPostofficeBranchRecord[]>;
	deleteWriteBranches(
		branchRecords: IPostofficeBranchRecord[]
	): Promise<IBulkCreateUpdateResponse>;
	writeUpdateBranches(
		branchRecords: IPostofficeBranchRecord[]
	): Promise<IBulkCreateUpdateResponse>;
	getAllBranchesIdAndQnomyCode(): Promise<IBranchIdQnomyCodePair[]>;
	getAllBranchesIdAndQnomyCodeExcluding(
		branchIdsToExclude: string[]
	): Promise<IBranchIdQnomyCodePair[]>;
	updateBranchServices(args: {
		servicesModel: IPostofficeBranchServices;
	}): Promise<{ actionResult: string; successfulActions: number; failedActions: number }>;
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

	async getAllBranchesExcluding(
		branchIdsToExclude: string[]
	): Promise<IPostofficeBranchRecord[]> {
		if (!Array.isArray(branchIdsToExclude))
			throw Error(
				`[Postoffice Branches Repository][Get All Branches Excluding] Branch Ids To Exclude is not array`
			);
		if (branchIdsToExclude.length && typeof branchIdsToExclude[0] !== 'string')
			throw Error(
				`[Postoffice Branches Repository][Get All Branches Excluding] Branch Ids To Exclude includes non-string values`
			);
		const { data, status, statusText } = await this.branches.getBranchesExcluding({
			excludeBranchIds: branchIdsToExclude,
		});
		if (status < 200 || status > 299)
			throw Error(
				`[Postoffice Branches Repository][Get All Branches Excluding] Error${status} : ${
					statusText ?? 'No status text'
				}`
			);
		if (!Array.isArray(data?.hits?.hits))
			throw Error(
				`[Postoffice Branches Repository][Get All Branches Excluding] Query result is not an array`
			);
		const branchRecords: IPostofficeBranchRecord[] = data?.hits?.hits.map((branchQuery) => {
			try {
				return useSingleBranchQueryResponse({ rawQueryResponse: branchQuery }).build();
			} catch (error) {
				throw Error(`Branch ${branchQuery._id} : ` + (error as Error).message);
			}
		});
		return branchRecords;
	}

	async writeUpdateBranches(branchRecords: IPostofficeBranchRecord[]) {
		const rawBulkAddResponse = await this.branches.bulkAddBranches({
			addBranches: branchRecords.map((branchRecord) => branchRecord.getBranchDocumentCopy()),
		});
		if (rawBulkAddResponse.status < 200 || rawBulkAddResponse.status > 299) {
			throw Error(
				`[Postoffice Branches Repository][Write Update Branches] Error${
					rawBulkAddResponse.status
				} : ${rawBulkAddResponse.statusText ?? 'No status text'}`
			);
		}
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

	async getAllBranchesIdAndQnomyCode(): Promise<IBranchIdQnomyCodePair[]> {
		const { data, status, statusText } = await this.branches.fetchAllQnomyCodes();
		if (status < 200 || status > 299) {
			throw Error(
				`[Postoffice Branches Repository][Get All Branches Id And Qnomy Code] Error${status} : ${
					statusText ?? 'No status text'
				}`
			);
		}

		const rawQueryResult = data?.hits?.hits;
		if (!Array.isArray(rawQueryResult)) {
			throw Error(
				`[Postoffice Branches Repository][Get All Branches Id And Qnomy Code] Query result is not array`
			);
		}

		const codePairBuilder: IPostofficeBranchIdCodePairBuilder =
			new PostofficeBranchIdCodePairBuilder();
		return rawQueryResult.map((qResponse) => {
			return codePairBuilder
				.withBranchId({ branchId: qResponse._id })
				.withQnomyCode({ qnomycode: qResponse._source?.qnomycode })
				.build();
		});
	}

	async getAllBranchesIdAndQnomyCodeExcluding(
		branchIdsToExclude: string[]
	): Promise<IBranchIdQnomyCodePair[]> {
		const branches = await this.getAllBranchesExcluding(branchIdsToExclude);
		const IdCodePairBuilder: IPostofficeBranchIdCodePairBuilder =
			new PostofficeBranchIdCodePairBuilder();
		return branches.map((branch) => {
			return IdCodePairBuilder.withBranchId({
				branchId: branch.getBranchNumber().toString(),
			})
				.withQnomyCode({ qnomycode: branch.getBranchIdAndQnomycode() })
				.build();
		});
	}

	async updateBranchServices(args: {
		servicesModel: IPostofficeBranchServices;
	}): Promise<{ actionResult: string; successfulActions: number; failedActions: number }> {
		const rawResponse = await this.branches.updateBranchServices({
			branchID: String(args.servicesModel.getBranchId()),
			services: args.servicesModel.getServices(),
		});

		const { data, status, statusText } = rawResponse;
		if (status < 200 || status > 299) {
			throw Error(
				`[Postoffice Branches Repository][writeUpdateBranch] Error status ${status} : ${
					statusText ?? 'No status text'
				}`
			);
		}

		const actionResult = data.updated ? 'updated' : data.deleted ? 'deleted' : 'no-action';
		const successfulActions = data.total ?? 0;
		const failedActions = data.failures.length ?? 0;
		return { actionResult, successfulActions, failedActions };
	}

	getBranchByID() {}
	writeUpdateBranch() {}
}
