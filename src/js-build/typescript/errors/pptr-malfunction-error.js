"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerMalfunctionError = void 0;
const custom_error_1 = require("./custom-error");
class PuppeteerMalfunctionError extends custom_error_1.CustomError {
    constructor(errorMessage) {
        super(errorMessage);
        this.statusCode = 503;
        this.errorMessage = errorMessage;
        Object.setPrototypeOf(this, PuppeteerMalfunctionError.prototype);
    }
    serializeErrors() {
        return [{ message: this.errorMessage }];
    }
}
exports.PuppeteerMalfunctionError = PuppeteerMalfunctionError;
