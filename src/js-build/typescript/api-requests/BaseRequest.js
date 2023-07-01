"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseApiRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const NotProvided_1 = require("../errors/NotProvided");
class BaseApiRequest {
    constructor() {
        this.producedData = {};
        this.producedCookies = {};
        this.requestCookieHeaders = [];
        this.requestUrlAttributes = [];
        this.requestHeadersKeys = [];
        this.requestDataKeys = [];
        this.responseCookieHeaders = [];
        this.responseDataKeys = [];
        this.nestedResponse = [];
        this.nameOfThis = 'BaseApiRequest';
    }
    makeRequest(cookies = {}, urlAttribute = {}, headers = {}, data = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkProvidedData('Cookie', cookies, this.requestCookieHeaders, true);
            this.checkProvidedData('Url', urlAttribute, this.requestUrlAttributes, true);
            this.checkProvidedData('Headers', headers, this.requestHeadersKeys, true);
            this.checkProvidedData('Data', data, this.requestDataKeys, true);
            const server_response = yield axios_1.default.request(this.buildRequest(cookies, urlAttribute, headers, data));
            let response_cookies = [];
            if (server_response.headers) {
                response_cookies = server_response.headers['set-cookie'] || [];
            }
            const response_data = server_response.data;
            const parsed_data = this.parseResponseData(response_data);
            const parsed_cookies = this.parseResponseCookies(response_cookies);
            this.checkProvidedData('RHeaders', parsed_cookies, this.responseCookieHeaders, false);
            this.checkProvidedData('RData', parsed_data, this.responseDataKeys, false);
            this.producedData = parsed_data;
            this.producedCookies = parsed_cookies;
            return {
                data: this.producedData,
                cookies: this.producedCookies,
                nested: this.nestedResponse,
            };
        });
    }
    checkProvidedData(reason, provided = {}, expected, beforeRequest) {
        // console.log(' [BaseApiRequest] [checkProvidedData] reason: ', reason);
        for (const expectedKey of expected) {
            if (!provided.hasOwnProperty(expectedKey)) {
                // console.log('??? provided ??? : ', provided);
                // console.log('??? expectedKey ??? : ', expectedKey);
                throw new NotProvided_1.NotProvided({
                    message: `${beforeRequest ? 'provided' : 'produced'} data does not contain expected: ${expectedKey} `,
                    source: `[${this.nameOfThis}] checkProvidedData`,
                });
            }
        }
    }
    parseResponseCookies(cookies) {
        const transformed = {};
        cookies.forEach((cell) => {
            if (cell.includes('=')) {
                const delimiter = ';'; // Throw away all the information after ';'
                const delimiterIndex = cell.indexOf(delimiter);
                let tempCookieArr;
                if (cell.includes('CentralJWTCookie=jwt=')) {
                    // Split on the first '=' sign.
                    tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=jwt=');
                    transformed[tempCookieArr[0]] = 'jwt=' + tempCookieArr[1];
                }
                else {
                    tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=');
                    transformed[tempCookieArr[0]] = tempCookieArr[1];
                }
            } // Ignores a cell without '=' sign.
        });
        return transformed;
    }
    reformatForAxios(cookies) {
        const responseArray = [];
        for (const cookie in cookies) {
            responseArray.push(`${String(cookie)}=${cookies[cookie]}`);
        }
        return responseArray.join(' ');
    }
    //! Only two levels of depth !
    // This done to fit the predefined class data members.
    transformResponse(data) {
        const transformed = {};
        for (const key in data) {
            const value = data[key];
            // Transform anything not nested directly to string.
            if (typeof value !== 'object' || value === null) {
                transformed[key] = String(value);
            }
            else {
                // Iterate over nested keys (one level of depth).
                for (const nestedKey in value) {
                    // If null there will be nothing to iterate.
                    const nestedValue = value[nestedKey];
                    if (typeof nestedValue !== 'object' && nestedValue !== null) {
                        transformed[nestedKey] = String(nestedValue);
                    }
                }
            }
        }
        return transformed;
    }
    getRequiredAndProvided() {
        return {
            requestCookieHeaders: this.requestCookieHeaders,
            requestDataKeys: this.requestDataKeys,
            requestHeadersKeys: this.requestHeadersKeys,
            requestUrlAttributes: this.requestUrlAttributes,
            responseCookieHeaders: this.responseCookieHeaders,
            responseDataKeys: this.responseDataKeys,
        };
    }
    getTodayDateObject() {
        const today = new Date();
        const year = today.getFullYear();
        // 'getMonth' returns a zero-based value: January == 0.
        // padStart ensures that i have 2 'digits', it pads with 0 in case i have 1 digit.
        const month = String(today.getMonth() + 1).padStart(2, '0');
        // same procedure as month.
        const day = String(today.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        return {
            date: dateString,
            year: String(year),
            month: String(month),
            day: String(day),
        };
    }
    validateDateFormat(dateString) {
        // Regular expression pattern for yyyy-mm-dd format
        const pattern = /^\d{4}-\d{2}-\d{2}$/;
        // Check if the string matches the pattern
        return pattern.test(dateString);
    }
}
exports.BaseApiRequest = BaseApiRequest;
