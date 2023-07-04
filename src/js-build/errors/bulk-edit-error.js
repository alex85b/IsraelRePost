"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkAddError = void 0;
const custom_error_1 = require("./custom-error");
class BulkAddError extends custom_error_1.CustomError {
    constructor(errors) {
        super('Bulk add error');
        this.errors = errors;
        this.statusCode = 503;
        Object.setPrototypeOf(this, BulkAddError.prototype);
    }
    serializeErrors() {
        return this.errors;
    }
}
exports.BulkAddError = BulkAddError;
