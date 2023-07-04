"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseApiRequestBuilder = void 0;
const bad_request_error_1 = require("../errors/bad-request-error");
const cookie_absent_error_1 = require("../errors/cookie-absent-error");
class BaseApiRequestBuilder {
    constructor(cookies, authorization, urlAttributes, data) {
        this.cookies = cookies;
        this.authorization = authorization;
        this.urlAttributes = urlAttributes;
        this.data = data;
        if (urlAttributes === null || urlAttributes === void 0 ? void 0 : urlAttributes.startDate) {
            const dateError = new bad_request_error_1.BadRequestError({
                message: 'the date provided should be of the format: yyyy, dd, mm',
                source: 'BaseApiRequestBuilder',
            });
            const yearPattern = /^\d{4}$/;
            const dayMonthPattern = /^\d{2}$/;
            if (!yearPattern.test(urlAttributes === null || urlAttributes === void 0 ? void 0 : urlAttributes.startDate.yyyy))
                throw dateError;
            if (!dayMonthPattern.test(urlAttributes === null || urlAttributes === void 0 ? void 0 : urlAttributes.startDate.mm))
                throw dateError;
            if (!dayMonthPattern.test(urlAttributes === null || urlAttributes === void 0 ? void 0 : urlAttributes.startDate.dd))
                throw dateError;
        }
    }
    reformatForAxios(cookies, keysToSearch) {
        const responseArray = [];
        for (const key of keysToSearch) {
            if (!(key in cookies)) {
                throw new cookie_absent_error_1.CookieAbsentError({
                    message: 'Missing cookie',
                    source: String(key),
                });
            }
            responseArray.push(`${String(key)}=${cookies[key]}`);
        }
        return responseArray;
    }
}
exports.BaseApiRequestBuilder = BaseApiRequestBuilder;
