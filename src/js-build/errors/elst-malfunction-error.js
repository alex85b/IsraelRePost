"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticMalfunctionError = void 0;
const custom_error_1 = require("./custom-error");
class ElasticMalfunctionError extends custom_error_1.CustomError {
    constructor(errorMessage) {
        super(errorMessage);
        this.statusCode = 503;
        this.errorMessage = errorMessage;
        Object.setPrototypeOf(this, ElasticMalfunctionError.prototype);
    }
    serializeErrors() {
        return [{ message: this.errorMessage }];
    }
}
exports.ElasticMalfunctionError = ElasticMalfunctionError;
