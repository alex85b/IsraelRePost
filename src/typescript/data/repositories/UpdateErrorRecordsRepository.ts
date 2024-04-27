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
}

export class UpdateErrorRecordsRepository implements IUpdateErrorRecordsRepository {
	private errors: IUpdateErrorsIndexing;

	constructor() {
		this.errors = new UpdateErrorsIndexing();
	}

	async getAllErrorRecords() {
		const rawResponse = await this.errors.fetchAllErrors();
		const { data, status, statusText } = rawResponse;
		if (status < 200 || status > 299) {
			throw Error(
				`[Update Errors Repository][Get All Error Records] Error${status} : ${
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
}
