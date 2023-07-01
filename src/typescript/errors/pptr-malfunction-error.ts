import { CustomError } from './custom-error';

export class PuppeteerMalfunctionError extends CustomError {
	statusCode = 503;
	errorMessage: string;

	constructor(errorMessage: string) {
		super(errorMessage);
		this.errorMessage = errorMessage;
		Object.setPrototypeOf(this, PuppeteerMalfunctionError.prototype);
	}

	serializeErrors() {
		return [{ message: this.errorMessage }];
	}
}
