import { CustomError } from './custom-error';

export class NotProvided extends CustomError {
	constructor(private errors: { message: string; source: string }) {
		super('setupElasticPuppeteer error');
		Object.setPrototypeOf(this, NotProvided.prototype);
	}

	serializeErrors() {
		return [this.errors];
	}
}
