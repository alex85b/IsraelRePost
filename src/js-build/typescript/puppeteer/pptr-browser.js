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
exports.PuppeteerBrowser = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const cheerio_1 = __importDefault(require("cheerio")); // ? parse5 has better benchmark score. maybe switch to parse5.
const cookie_bank_1 = require("../common/cookie-bank");
const pptr_malfunction_error_1 = require("../errors/pptr-malfunction-error");
// puppeteer.use(StealthPlugin());
// This represents the puppeteer automation that needed to scrape Israel-post.
class PuppeteerBrowser {
    constructor(browserMode, navigationTimeout) {
        this.browserMode = browserMode;
        this.navigationTimeout = navigationTimeout;
        this.browser = null;
        this.page = null;
        this.cookies = new cookie_bank_1.CookieBank();
        this.RequestVerificationToken = '';
        this.xhrRequests = [];
        this.xhrResponse = [];
    }
    generateBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.browser) {
                puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
                this.browser = yield puppeteer_extra_1.default.launch({
                    headless: this.browserMode,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    defaultViewport: null,
                });
            }
        });
    }
    generatePage(navigationTimeout) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser && !this.page) {
                this.page = yield this.browser.newPage();
                this.page.setDefaultNavigationTimeout(navigationTimeout);
                // await this.page.setRequestInterception(true);
                // this.page.on('request', (interceptedRequest) => {
                // 	if (interceptedRequest.resourceType() === 'xhr') {
                // 		this.xhrRequests.push({
                // 			url: interceptedRequest.url(),
                // 			method: interceptedRequest.method(),
                // 			headers: interceptedRequest.headers(),
                // 			postData: interceptedRequest.postData(),
                // 		});
                // 	}
                // 	interceptedRequest.continue();
                // });
                // this.page.on('response', async (response: HTTPResponse) => {
                // 	if (response.request().resourceType() === 'xhr') {
                // 		// Transform the XHR response into an object
                // 		this.xhrResponse.push({
                // 			url: response.url(),
                // 			status: response.status(),
                // 			headers: response.headers(),
                // 			body: await response.text(),
                // 		});
                // 	}
                // });
                // console.log(`### setDefaultNavigationTimeout: ${navigationTimeout} ###`);
            }
        });
    }
    navigateToURL(url) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.browser)
                yield this.generateBrowser();
            if (!this.page)
                yield this.generatePage(this.navigationTimeout);
            if (typeof url === 'string') {
                yield ((_a = this.page) === null || _a === void 0 ? void 0 : _a.goto(url));
            }
            else {
                yield ((_b = this.page) === null || _b === void 0 ? void 0 : _b.goto(url.PartialBranchUrl + String(url.branchNumber)));
            }
        });
    }
    getXhrRequests() {
        return this.xhrRequests;
    }
    getXhrResponse() {
        return this.xhrResponse;
    }
    extractHtmlToken() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.browser)
                yield this.generateBrowser();
            if (!this.page)
                yield this.generatePage(this.navigationTimeout);
            const htmlContent = (yield ((_a = this.page) === null || _a === void 0 ? void 0 : _a.content())) || '';
            const $ = cheerio_1.default.load(htmlContent);
            const RequestVerificationToken = $('input[name="__RequestVerificationToken"]').val() || '';
            if (typeof RequestVerificationToken === 'string') {
                this.RequestVerificationToken = RequestVerificationToken;
            }
            else {
                this.RequestVerificationToken = RequestVerificationToken[0];
            }
            return this.RequestVerificationToken;
        });
    }
    getSavedHtmlToken() {
        return this.RequestVerificationToken;
    }
    getSavedCookies() {
        return this.cookies.getCookies();
    }
    extractAllCookies() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.browser)
                yield this.generateBrowser();
            if (!this.page)
                yield this.generatePage(this.navigationTimeout);
            const cookies = yield ((_a = this.page) === null || _a === void 0 ? void 0 : _a.cookies());
            // console.log('??? [PuppeteerBrowser] [extractAllCookies] Cookies: ', cookies);
            if (!cookies || !cookies.length)
                throw new pptr_malfunction_error_1.PuppeteerMalfunctionError('extractAllCookies failed');
            return this.cookies.importPuppeteerCookies(cookies);
        });
    }
    closePageAndBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.page) {
                yield this.page.close();
                this.page = null;
            }
            if (this.browser) {
                yield this.browser.close();
                this.browser = null;
            }
        });
    }
    resetCookiesAndToken() {
        this.cookies = new cookie_bank_1.CookieBank();
        this.RequestVerificationToken = '';
    }
    end() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.closePageAndBrowser();
            this.resetCookiesAndToken();
        });
    }
}
exports.PuppeteerBrowser = PuppeteerBrowser;
