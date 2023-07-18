import { CustomError } from './custom-error';

export class BadApiResponse extends CustomError {
	constructor(private error: { message: string; source: string; data?: any }) {
		super('Bad Api Response');
		Object.setPrototypeOf(this, BadApiResponse.prototype);
	}

	serializeErrors() {
		return [this.error];
	}
}
