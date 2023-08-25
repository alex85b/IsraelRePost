// import { CustomError } from './custom-error';

// export class BadRequestError extends CustomError {
// 	statusCode = 400;

// 	constructor(private errors: { message: string; source: string }) {
// 		super('Bulk add error');
// 		Object.setPrototypeOf(this, BadRequestError.prototype);
// 	}

// 	serializeErrors() {
// 		return [this.errors];
// 	}
// }
