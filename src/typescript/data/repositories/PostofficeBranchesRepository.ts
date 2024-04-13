import {
	BranchServicesIndexing,
	IBranchServicesIndexing,
} from '../../api/elastic/branchServices/BranchServicesIndexing';
import {
	IPostofficeBranchRecord,
	PostofficeBranchRecord,
} from '../models/persistenceModels/PostofficeBranchRecord';

export class PostofficeBranchesRepository {
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

		const records: IPostofficeBranchRecord[] = rawQueryResult.map((branchQuery) => {
			try {
				return new PostofficeBranchRecord.Builder()
					.useSingleBranchQueryResponse({ rawQueryResponse: branchQuery })
					.build();
			} catch (error) {
				throw Error(`Branch ${branchQuery._id} : ` + (error as Error).message);
			}
		});

		return records;
	}

	getBranchByID() {}
	writeUpdateBranch() {}
	writeUpdateBranches() {}
}
