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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPageData = void 0;
const pptr_browser_1 = require("../puppeteer/pptr-browser");
const NotProvided_1 = require("../errors/NotProvided");
const cookie_bank_1 = require("../common/cookie-bank");
const extractPageData = (url, navigationTimeout, doExtractHtml, doExtractCookies, doClosePuppeteer) => __awaiter(void 0, void 0, void 0, function* () {
    const puppeteerClient = new pptr_browser_1.PuppeteerBrowser('new', navigationTimeout);
    try {
        yield puppeteerClient.navigateToURL(url);
        const cookieBank = new cookie_bank_1.CookieBank();
        let htmlToken = '';
        if (doExtractHtml) {
            htmlToken = yield puppeteerClient.extractHtmlToken();
            if (!htmlToken || htmlToken.length === 0) {
                throw new NotProvided_1.NotProvided({
                    message: 'No token provided',
                    source: 'extractHtmlToken',
                });
            }
        }
        if (doExtractCookies) {
            const cookies = yield puppeteerClient.extractAllCookies();
            console.log('??? [extractPageData] [doExtractCookies] cookies: ', cookies);
            if (Object.keys(cookies).length === 0) {
                throw new NotProvided_1.NotProvided({
                    message: 'No cookies provided',
                    source: 'extractAllCookies',
                });
            }
            cookieBank.addCookies(cookies);
            console.log('??? [extractPageData] [doExtractCookies] cookieBank: ', cookieBank.getCookies());
        }
        if (doClosePuppeteer)
            puppeteerClient.end();
        console.error('### [extractPageData] Done ###');
        return {
            cookies: cookieBank.getCookies(),
            htmlToken: htmlToken,
            puppeteer: puppeteerClient,
        };
    }
    catch (error) {
        puppeteerClient.end();
        console.error('### [extractPageData] Error ###');
        throw error;
    }
});
exports.extractPageData = extractPageData;
