// import { CustomError, ISerializeErrorObj } from './custom-error';

// interface IBadApiResponse extends ISerializeErrorObj {
// 	message: string;
// 	errorLocation: string;
// 	responseMessage: string;
// 	responseStatus: string;
// }

// export class BadApiResponse extends CustomError {
// 	constructor(private error: IBadApiResponse) {
// 		super('Bad Api Response');
// 		Object.setPrototypeOf(this, BadApiResponse.prototype);
// 	}

// 	serializeErrors() {
// 		return [this.error];
// 	}
// }
