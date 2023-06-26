import { CustomError } from './custom-error';

export class BadApiResponse extends CustomError {
	statusCode = 400;

	constructor(private error: { message: string; source: string }) {
		super('Bad Api Response');
		Object.setPrototypeOf(this, BadApiResponse.prototype);
	}

	serializeErrors() {
		return [this.error];
	}
}