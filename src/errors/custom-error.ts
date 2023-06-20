/*
    I want to return an uniform format of errors:
    an array of { message: error-message }.

    This will be an abstract base of 'Uniform' custom errors.

    This will be used in a custom error handler,
    Said handler will expect to use statuscode, and serializeErrors(), for response.
*/

export abstract class CustomError extends Error {
	abstract statusCode: number;

	constructor(errorMessage: string) {
		super(errorMessage);
		Object.setPrototypeOf(this, CustomError.prototype);
	}

	abstract serializeErrors(): {
		message: string;
		source?: string;
	}[];
}
