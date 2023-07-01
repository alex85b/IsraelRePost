"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotProvided = void 0;
const custom_error_1 = require("./custom-error");
class NotProvided extends custom_error_1.CustomError {
    constructor(errors) {
        super('setupElasticPuppeteer error');
        this.errors = errors;
        this.statusCode = 404; // Not Found.
        Object.setPrototypeOf(this, NotProvided.prototype);
    }
    serializeErrors() {
        return [this.errors];
    }
}
exports.NotProvided = NotProvided;
