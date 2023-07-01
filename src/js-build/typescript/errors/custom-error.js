"use strict";
/*
    I want to return an uniform format of errors:
    an array of { message: error-message }.

    This will be an abstract base of 'Uniform' custom errors.

    This will be used in a custom error handler,
    Said handler will expect to use statuscode, and serializeErrors(), for response.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(errorMessage) {
        super(errorMessage);
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}
exports.CustomError = CustomError;
