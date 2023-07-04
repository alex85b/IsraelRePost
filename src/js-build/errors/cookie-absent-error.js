"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieAbsentError = void 0;
const custom_error_1 = require("./custom-error");
class CookieAbsentError extends custom_error_1.CustomError {
    constructor(cookieError) {
        super('Cookie not found');
        this.cookieError = cookieError;
        this.statusCode = 404;
        Object.setPrototypeOf(this, CookieAbsentError.prototype);
    }
    serializeErrors() {
        return [
            { message: this.cookieError.message, source: this.cookieError.source },
        ];
    }
}
exports.CookieAbsentError = CookieAbsentError;
