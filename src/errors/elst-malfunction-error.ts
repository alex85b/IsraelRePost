import { CustomError } from './custom-error';

export class ElasticMalfunctionError extends CustomError {
	statusCode = 503;
	errorMessage: string;

	constructor(errorMessage: string) {
		super(errorMessage);
		this.errorMessage = errorMessage;
	}

	serializeErrors() {
		return [{ message: this.errorMessage }];
	}
}
