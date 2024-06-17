import { isValidNumber, isValidString } from '../shared/FieldValidation';

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

export class PostofficeBranchIdCodePairBuilder implements IPostofficeBranchIdCodePairBuilder {
	private faults: string[];
	private branchId: string | undefined;
	private qnomycode: number | undefined;
	constructor() {
		this.faults = [];
	}

	withBranchId(data: { branchId: string }) {
		if (!isValidString(data.branchId)) this.faults.push('branchId is invalid string');
		else this.branchId = data.branchId;
		return this;
	}

	withQnomyCode(data: { qnomycode: number }) {
		if (!isValidNumber(data.qnomycode)) this.faults.push('qnomycode is invalid number');
		else this.qnomycode = data.qnomycode;
		return this;
	}

	useStringedJson(data: { serializedItems: string }) {
		if (!isValidString(data.serializedItems))
			this.faults.push('serializedItems is not a string');
		else {
			try {
				const deserialized = JSON.parse(data.serializedItems) as IBranchIdQnomyCodePair;
				return this.withBranchId({ branchId: deserialized.branchId }).withQnomyCode({
					qnomycode: deserialized.qnomycode,
				});
			} catch (error) {
				this.faults.push('serializedItems is not a JSON');
			}
		}
		return this;
	}

	build(): IBranchIdQnomyCodePair {
		try {
			if (this.faults.length)
				throw Error(
					'[PostofficeBranchIdCodePairBuilder] Errors : ' + this.faults.join(' | ')
				);
			if (!this.branchId)
				throw Error('[PostofficeBranchIdCodePairBuilder] branchId is invalid');
			if (!this.qnomycode)
				throw Error('[PostofficeBranchIdCodePairBuilder] qnomycode is invalid');
			return { branchId: this.branchId, qnomycode: this.qnomycode };
		} finally {
			this.faults = [];
			this.branchId = undefined;
			this.qnomycode = undefined;
		}
	}
}

export const deserializeBranchIdCodePairs = (data: { serializedCodeIdPair: string[] }) => {
	if (!Array.isArray(data.serializedCodeIdPair)) return [];
	const build: IPostofficeBranchIdCodePairBuilder = new PostofficeBranchIdCodePairBuilder();
	return data.serializedCodeIdPair.map((ser) =>
		build.useStringedJson({ serializedItems: ser }).build()
	);
};
