import {
	IUpdateErrorsIndexing,
	UpdateErrorsIndexing,
} from "../../api/elastic/updateErrors/UpdateErrorsIndexing";
import { ServiceError, ErrorSource } from "../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../shared/classes/WinstonClient";
import {
	IPostofficeUpdateError,
	useSingleErrorQueryResponse,
} from "../models/persistenceModels/UpdateErrorRecord";

export interface IUpdateErrorRecordsRepository {
	getAllErrorRecords(): Promise<IPostofficeUpdateError[]>;
	addUpdateErrorRecord(args: { errorModel: IPostofficeUpdateError }): Promise<{
		actionResult: "created" | "updated";
		successfulActions: number;
		failedActions: number;
	}>;
}

export class UpdateErrorRecordsRepository
	implements IUpdateErrorRecordsRepository
{
	private errors: IUpdateErrorsIndexing;
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor() {
		this.errors = new UpdateErrorsIndexing();
		this.pathStack = new PathStack().push("Update Error Records Repository");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	async getAllErrorRecords(): Promise<IPostofficeUpdateError[]> {
		this.pathStack.push("Get All Error Records");
		try {
			const rawResponse = await this.errors.fetchAllErrors();
			const { data, status, statusText } = rawResponse;
			if (status < 200 || status > 299) {
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Database,
					message: "Request status indicates a failure",
					details: {
						status: status,
						statusText: statusText,
					},
				});
			}

			const rawQueryResult = data?.hits?.hits;
			if (!Array.isArray(rawQueryResult)) {
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Database,
					message: "Query Result is invalid: not an Array",
					details: {
						result: rawQueryResult,
					},
				});
			}

			return rawQueryResult.map((result) =>
				useSingleErrorQueryResponse({ rawQueryResponse: result }).build(
					result._id
				)
			);
		} finally {
			this.pathStack.pop();
		}
	}

	async addUpdateErrorRecord(args: {
		errorModel: IPostofficeUpdateError;
	}): Promise<{
		actionResult: "created" | "updated";
		successfulActions: number;
		failedActions: number;
	}> {
		this.pathStack.push("Add Update Error Record");
		const rawResponse = await this.errors.updateAddError({
			branchIndex: Number.parseInt(args.errorModel.getBranchId()),
			errorRecord: args.errorModel.getErrorDocument(),
		});

		const { data, status, statusText } = rawResponse;
		if (status < 200 || status > 299) {
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Request status indicates a failure",
				details: {
					status,
					statusText,
					data,
				},
			});
		}

		const faults: string[] = [];
		const actionResult = data?.result;
		const successfulActions = data?._shards?.successful ?? 0;
		const failedActions = data?._shards?.failed ?? 0;

		if (actionResult !== "created" && actionResult !== "updated")
			faults.push("add-update action result invalid");
		if (successfulActions < 1)
			faults.push(`add-update action success-counter is ${successfulActions}`);
		if (failedActions > 0)
			faults.push(`add-update action success-counter is ${failedActions}`);
		if (faults.length)
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Update-error Record is faulty",
				details: {
					actionResult,
					faults: faults.join(" | "),
					successfulActions,
					failedActions,
				},
			});
		this.pathStack.pop();
		return { actionResult, successfulActions, failedActions };
	}
}
