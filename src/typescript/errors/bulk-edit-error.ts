import { CustomError, ISerializeErrorObj } from './custom-error';

export interface IBulkError extends ISerializeErrorObj {
	message: string;
	source: string;
}

export class BulkAddError extends CustomError {
	constructor(private errors: IBulkError[]) {
		super('Bulk add error');
		Object.setPrototypeOf(this, BulkAddError.prototype);
	}

	serializeErrors() {
		return this.errors;
	}
}
