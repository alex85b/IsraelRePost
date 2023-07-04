import { CustomError } from './custom-error';

export class CookieAbsentError extends CustomError {
	statusCode = 404;

	constructor(private cookieError: { message: string; source: string }) {
		super('Cookie not found');
		Object.setPrototypeOf(this, CookieAbsentError.prototype);
	}

	serializeErrors() {
		return [
			{ message: this.cookieError.message, source: this.cookieError.source },
		];
	}
}