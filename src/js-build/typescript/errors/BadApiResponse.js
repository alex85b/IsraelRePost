"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadApiResponse = void 0;
const custom_error_1 = require("./custom-error");
class BadApiResponse extends custom_error_1.CustomError {
    constructor(error) {
        super('Bad Api Response');
        this.error = error;
        this.statusCode = 400;
        Object.setPrototypeOf(this, BadApiResponse.prototype);
    }
    serializeErrors() {
        return [this.error];
    }
}
exports.BadApiResponse = BadApiResponse;
