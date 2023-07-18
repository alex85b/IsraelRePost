import { CustomError } from './custom-error';

export class NotFoundError extends CustomError {
	constructor() {
		super('Resource not found');
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}

	serializeErrors() {
		return [{ message: 'Resource not found' }];
	}
}
