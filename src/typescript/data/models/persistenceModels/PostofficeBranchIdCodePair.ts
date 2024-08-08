import { ServiceError, ErrorSource } from "../../../errors/ServiceError";
import { IPathTracker, PathStack } from "../../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../../shared/classes/WinstonClient";
import { isValidNumber, isValidString } from "../shared/FieldValidation";

export interface IPostofficeBranchIdCodePairBuilder {
	useStringedJson(data: { serializedItems: string }): this;
	build(): IBranchIdQnomyCodePair;
	withBranchId(data: { branchId: string }): this;
	withQnomyCode(data: { qnomycode: number }): this;
}

export interface IBranchIdQnomyCodePair {
	branchId: string;
	qnomycode: number;
}

export class PostofficeBranchIdCodePairBuilder
	implements IPostofficeBranchIdCodePairBuilder
{
	private faults: string[];
	private branchId: string | undefined;
	private qnomycode: number | undefined;
	private logger: ILogger;
	private pathStack: IPathTracker;

	constructor() {
		this.faults = [];
		this.pathStack = new PathStack().push(
			"Postoffice Branch-id Code Pair Builder"
		);
		this.logger = new WinstonClient({ pathStack: this.pathStack });
	}

	withBranchId(data: { branchId: string }) {
		if (!isValidString(data.branchId))
			this.faults.push("branchId is invalid string");
		else this.branchId = data.branchId;
		return this;
	}

	withQnomyCode(data: { qnomycode: number }) {
		if (!isValidNumber(data.qnomycode))
			this.faults.push("qnomycode is invalid number");
		else this.qnomycode = data.qnomycode;
		return this;
	}

	useStringedJson(data: { serializedItems: string }) {
		if (!isValidString(data.serializedItems))
			this.faults.push("serializedItems is not a string");
		else {
			try {
				const deserialized = JSON.parse(
					data.serializedItems
				) as IBranchIdQnomyCodePair;
				return this.withBranchId({
					branchId: deserialized.branchId,
				}).withQnomyCode({
					qnomycode: deserialized.qnomycode,
				});
			} catch (error) {
				this.faults.push("serializedItems is not a JSON");
			}
		}
		return this;
	}

	build(): IBranchIdQnomyCodePair {
		try {
			if (this.faults.length)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Database,
					message: "PO Branch-id Code Pair has Faults",
					details: {
						faults: this.faults.join(" | "),
					},
				});
			if (!this.branchId)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Database,
					message: "PO Branch-id is Invalid",
					details: {
						branchId: this.branchId,
					},
				});
			if (!this.qnomycode)
				throw new ServiceError({
					logger: this.logger,
					source: ErrorSource.Database,
					message: "PO Qnomy Code is Invalid",
					details: {
						branchId: this.branchId,
					},
				});
			return { branchId: this.branchId, qnomycode: this.qnomycode };
		} finally {
			this.faults = [];
			this.branchId = undefined;
			this.qnomycode = undefined;
		}
	}
}

export const deserializeBranchIdCodePairs = (data: {
	serializedCodeIdPair: string[];
}) => {
	if (!Array.isArray(data.serializedCodeIdPair)) return [];
	const build: IPostofficeBranchIdCodePairBuilder =
		new PostofficeBranchIdCodePairBuilder();
	return data.serializedCodeIdPair.map((ser) =>
		build.useStringedJson({ serializedItems: ser }).build()
	);
};
