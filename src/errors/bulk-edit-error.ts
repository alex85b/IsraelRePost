import { CustomError } from './custom-error';

export interface IBulkError {
	message: string;
	source: string;
}

export class BulkAddError extends CustomError {
	statusCode = 503;

	constructor(private errors: IBulkError[]) {
		super('Bulk add error');
	}

	serializeErrors() {
		return this.errors;
	}
}
