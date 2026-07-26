import {
	BranchServicesIndexing,
	IBranchServicesIndexing,
} from "../../api/elastic/branchServices/BranchServicesIndexing";
import { ServiceError, ErrorSource } from "../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../shared/classes/WinstonClient";
import {
	BulkCreateUpdateResponse,
	IBulkCreateUpdateResponse,
} from "../models/dataTransferModels/elasticResponses/BulkCreateUpdateResponse";
import {
	IBranchIdQnomyCodePair,
	IPostofficeBranchIdCodePairBuilder,
	PostofficeBranchIdCodePairBuilder,
} from "../models/persistenceModels/PostofficeBranchIdCodePair";
import {
	IPostofficeBranchRecord,
	useSingleBranchQueryResponse,
} from "../models/persistenceModels/PostofficeBranchRecord";
import { IPostofficeBranchServices } from "../models/persistenceModels/PostofficeBranchServices";

export interface IPostofficeBranchesRepository {
	getAllBranches(): Promise<IPostofficeBranchRecord[]>;
	getAllBranchesExcluding(
		branchIdsToExclude: string[]
	): Promise<IPostofficeBranchRecord[]>;
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
	}): Promise<{
		actionResult: string;
		successfulActions: number;
		failedActions: number;
	}>;
}

export class PostofficeBranchesRepository
	implements IPostofficeBranchesRepository
{
	private branches: IBranchServicesIndexing;
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor() {
		this.branches = new BranchServicesIndexing();
		this.pathStack = new PathStack().push("Postoffice Branches Repository");
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	async getAllBranches() {
		this.pathStack.push("Get All Branches");
		const rawResponse = await this.branches.fetchAllBranches({
			maxRecords: 500,
		});
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

		const branchRecords: IPostofficeBranchRecord[] = rawQueryResult.map(
			(branchQuery) => {
				try {
					return useSingleBranchQueryResponse({
						rawQueryResponse: branchQuery,
					}).build();
				} catch (error) {
					throw new ServiceError({
						logger: this.logger,
						source: ErrorSource.Database,
						message: "Raw response parsing has failed",
						details: {
							branchID: branchQuery._id,
							error: (error as Error).message,
						},
					});
				}
			}
		);

		this.pathStack.pop();
		return branchRecords;
	}

	async getAllBranchesExcluding(
		branchIdsToExclude: string[]
	): Promise<IPostofficeBranchRecord[]> {
		this.pathStack.push("Get All Branches Excluding");
		if (!Array.isArray(branchIdsToExclude))
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Branch Ids To Exclude is not array",
				details: {
					exclude: branchIdsToExclude,
				},
			});
		if (branchIdsToExclude.length && typeof branchIdsToExclude[0] !== "string")
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Branch Ids To Exclude includes non-string values",
				details: {
					exclude: branchIdsToExclude,
				},
			});
		const { data, status, statusText } =
			await this.branches.getBranchesExcluding({
				excludeBranchIds: branchIdsToExclude,
			});
		if (status < 200 || status > 299)
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
		if (!Array.isArray(data?.hits?.hits))
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Query Result is invalid: not an Array",
				details: {
					result: data?.hits?.hits,
				},
			});
		const branchRecords: IPostofficeBranchRecord[] = data?.hits?.hits.map(
			(branchQuery) => {
				try {
					return useSingleBranchQueryResponse({
						rawQueryResponse: branchQuery,
					}).build();
				} catch (error) {
					throw new ServiceError({
						logger: this.logger,
						source: ErrorSource.Database,
						message: "Raw response parsing has failed",
						details: {
							branchID: branchQuery._id,
							error: (error as Error).message,
						},
					});
				}
			}
		);
		this.pathStack.pop();
		return branchRecords;
	}

	async writeUpdateBranches(branchRecords: IPostofficeBranchRecord[]) {
		this.pathStack.push("Write Update Branches");
		const rawBulkAddResponse = await this.branches.bulkAddBranches({
			addBranches: branchRecords.map((branchRecord) =>
				branchRecord.getBranchDocumentCopy()
			),
		});
		if (rawBulkAddResponse.status < 200 || rawBulkAddResponse.status > 299) {
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Request status indicates a failure",
				details: {
					status: rawBulkAddResponse.status,
					statusText: rawBulkAddResponse.statusText,
					data: rawBulkAddResponse.data,
				},
			});
		}
		const bulkAddResponse: IBulkCreateUpdateResponse =
			new BulkCreateUpdateResponse.Builder()
				.useAxiosResponse(rawBulkAddResponse)
				.build();
		this.pathStack.pop();
		return bulkAddResponse;
	}

	async deleteWriteBranches(branchRecords: IPostofficeBranchRecord[]) {
		this.pathStack.push("Delete write Branches");
		const deleteResponse = await this.branches.deleteAllBranches();
		if (deleteResponse.status > 299 || deleteResponse.status < 200)
			throw new ServiceError({
				logger: this.logger,
				source: ErrorSource.Database,
				message: "Request status indicates a failure",
				details: {
					status: deleteResponse.status,
					statusText: deleteResponse.statusText,
					data: deleteResponse.data,
				},
			});
		const rawBulkAddResponse = await this.branches.bulkAddBranches({
			addBranches: branchRecords.map((branchRecord) =>
				branchRecord.getBranchDocumentCopy()
			),
		});
		const bulkAddResponse: IBulkCreateUpdateResponse =
			new BulkCreateUpdateResponse.Builder()
				.useAxiosResponse(rawBulkAddResponse)
				.build();
		this.pathStack.pop();
		return bulkAddResponse;
	}

	async getAllBranchesIdAndQnomyCode(): Promise<IBranchIdQnomyCodePair[]> {
		this.pathStack.push("Get All Branch IDs And Qnomy codes");
		try {
			const { data, status, statusText } =
				await this.branches.fetchAllQnomyCodes();
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

			const rawQueryResult = data?.hits?.hits;
			if (!Array.isArray(rawQueryResult)) {
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Database,
					message: "Query result is not array",
					details: {
						result: rawQueryResult,
					},
				});
			}

			const codePairBuilder: IPostofficeBranchIdCodePairBuilder =
				new PostofficeBranchIdCodePairBuilder();

			return rawQueryResult.map((qResponse) => {
				return codePairBuilder
					.withBranchId({ branchId: qResponse._id })
					.withQnomyCode({ qnomycode: qResponse._source?.qnomycode })
					.build();
			});
		} finally {
			this.pathStack.pop();
		}
	}

	async getAllBranchesIdAndQnomyCodeExcluding(
		branchIdsToExclude: string[]
	): Promise<IBranchIdQnomyCodePair[]> {
		this.pathStack.push("Get All Branch IDs And Qnomy codes Excluding");
		try {
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
		} finally {
			this.pathStack.pop();
		}
	}

	async updateBranchServices(args: {
		servicesModel: IPostofficeBranchServices;
	}): Promise<{
		actionResult: string;
		successfulActions: number;
		failedActions: number;
	}> {
		this.pathStack.push("Update Branch Services");
		const rawResponse = await this.branches.updateBranchServices({
			branchID: String(args.servicesModel.getBranchId()),
			services: args.servicesModel.getServices(),
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

		const actionResult = data.updated
			? "updated"
			: data.deleted
			? "deleted"
			: "no-action";
		const successfulActions = data.total ?? 0;
		const failedActions = data.failures.length ?? 0;
		this.pathStack.pop();
		return { actionResult, successfulActions, failedActions };
	}

	getBranchByID() {}
	writeUpdateBranch() {}
}
