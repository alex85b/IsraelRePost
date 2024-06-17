import {
	IUpdateErrorsIndexing,
	UpdateErrorsIndexing,
} from '../../api/elastic/updateErrors/UpdateErrorsIndexing';
import {
	IPostofficeUpdateError,
	useSingleErrorQueryResponse,
} from '../models/persistenceModels/UpdateErrorRecord';

export interface IUpdateErrorRecordsRepository {
	getAllErrorRecords(): Promise<IPostofficeUpdateError[]>;
	addUpdateErrorRecord(args: { errorModel: IPostofficeUpdateError }): Promise<{
		actionResult: 'created' | 'updated';
		successfulActions: number;
		failedActions: number;
	}>;
}

export class UpdateErrorRecordsRepository implements IUpdateErrorRecordsRepository {
	private errors: IUpdateErrorsIndexing;

	constructor() {
		this.errors = new UpdateErrorsIndexing();
	}

	async getAllErrorRecords(): Promise<IPostofficeUpdateError[]> {
		const rawResponse = await this.errors.fetchAllErrors();
		const { data, status, statusText } = rawResponse;
		if (status < 200 || status > 299) {
			throw Error(
				`[Update Errors Repository][Get All Error Records] Error status ${status} : ${
					statusText ?? 'No status text'
				}`
			);
		}

		const rawQueryResult = data?.hits?.hits;
		if (!Array.isArray(rawQueryResult)) {
			throw Error(
				`[Update Errors Repository][Get All Error Records] Query result is not array`
			);
		}

		return rawQueryResult.map((result) =>
			useSingleErrorQueryResponse({ rawQueryResponse: result }).build(result._id)
		);
	}

	async addUpdateErrorRecord(args: { errorModel: IPostofficeUpdateError }): Promise<{
		actionResult: 'created' | 'updated';
		successfulActions: number;
		failedActions: number;
	}> {
		const rawResponse = await this.errors.updateAddError({
			branchIndex: Number.parseInt(args.errorModel.getBranchId()),
			errorRecord: args.errorModel.getErrorDocument(),
		});

		const { data, status, statusText } = rawResponse;
		if (status < 200 || status > 299) {
			throw Error(
				`[Update Errors Repository][Add Update Error Record] Error status ${status} : ${
					statusText ?? 'No status text'
				}`
			);
		}

		const faults: string[] = [];
		const actionResult = data?.result;
		const successfulActions = data?._shards?.successful ?? 0;
		const failedActions = data?._shards?.failed ?? 0;

		if (actionResult !== 'created' && actionResult !== 'updated')
			faults.push('add-update action result invalid');
		if (successfulActions < 1)
			faults.push(`add-update action success-counter is ${successfulActions}`);
		if (failedActions > 0) faults.push(`add-update action success-counter is ${failedActions}`);
		if (faults.length)
			throw Error(
				'[Update Errors Repository][Add Update Error Record] Faults : ' + faults.join(' | ')
			);
		return { actionResult, successfulActions, failedActions };
	}
}
