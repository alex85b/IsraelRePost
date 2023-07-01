"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieBank = void 0;
const cookie_absent_error_1 = require("../errors/cookie-absent-error");
class CookieBank {
    constructor() {
        this.cookies = {};
    }
    addCookies(cookies) {
        for (const key in cookies) {
            this.cookies[key] = cookies[key];
        }
    }
    importPuppeteerCookies(pptrCookies) {
        pptrCookies.forEach((cookie) => {
            this.cookies[cookie.name] = cookie.value;
        });
        return this.getCookies();
    }
    importAxiosCookies(axiosCookies) {
        axiosCookies.forEach((cell) => {
            if (cell.includes('=')) {
                const delimiter = ';';
                const delimiterIndex = cell.indexOf(delimiter);
                let tempCookieArr;
                if (cell.includes('CentralJWTCookie=jwt=')) {
                    tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=jwt=');
                    this.cookies[tempCookieArr[0]] = 'jwt=' + tempCookieArr[1];
                }
                else {
                    tempCookieArr = cell.substring(0, delimiterIndex + 1).split('=');
                    this.cookies[tempCookieArr[0]] = tempCookieArr[1];
                }
            }
        });
        return this.getCookies();
    }
    getCookieValue(cookieName) {
        if (!this.cookies[cookieName])
            throw new cookie_absent_error_1.CookieAbsentError({
                message: `Cookie ${cookieName} is missing`,
                source: 'getCookieValue',
            });
        return this.cookies[cookieName];
    }
    findCookies(keys) {
        const returnCookies = {};
        for (const key of keys) {
            if (!this.cookies[key])
                throw new cookie_absent_error_1.CookieAbsentError({
                    message: `Cookie ${keys} is missing`,
                    source: 'getCookieValue',
                });
            returnCookies[key] = this.cookies[key];
        }
        return returnCookies;
    }
    toString() {
        return JSON.stringify(this.cookies);
    }
    // shallow copy.
    getCookies() {
        return Object.assign({}, this.cookies);
    }
}
exports.CookieBank = CookieBank;
