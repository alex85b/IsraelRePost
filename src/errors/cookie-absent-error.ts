import { CustomError } from './custom-error';

export class CookieAbsentError extends CustomError {
	statusCode = 404;

	constructor() {
		super('Cookie not found');
		Object.setPrototypeOf(this, CookieAbsentError.prototype);
	}

	serializeErrors() {
		return [{ message: 'Cookie not found' }];
	}
}
