import { CustomError } from './custom-error';

export class ElasticMalfunctionError extends CustomError {
	statusCode = 503;
	errorMessage: string;

	constructor(errorMessage: string) {
		super(errorMessage);
		this.errorMessage = errorMessage;
		Object.setPrototypeOf(this, ElasticMalfunctionError.prototype);
	}

	serializeErrors() {
		return [{ message: this.errorMessage }];
	}
}
