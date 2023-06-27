import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page, Browser, Protocol, HTTPResponse } from 'puppeteer';
import cheerio from 'cheerio'; // ? parse5 has better benchmark score. maybe switch to parse5.
import { CookieBank } from '../common/cookie-bank';
import { URLs } from '../common/urls';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { PuppeteerMalfunctionError } from '../errors/pptr-malfunction-error';

// puppeteer.use(StealthPlugin());

// This represents the puppeteer automation that needed to scrape Israel-post.
export class PuppeteerBrowser {
	private browser: Browser | null;
	private page: Page | null;
	private cookies: CookieBank;
	private xhrRequests: {
		url: string;
		method: string;
		headers: Record<string, string>;
		postData: string | undefined;
	}[];
	private xhrResponse: {
		url: string;
		status: number;
		headers: Record<string, string>;
		body: string;
	}[];
	private RequestVerificationToken: string;

	constructor(
		private browserMode: boolean | 'new',
		private navigationTimeout: number
	) {
		this.browser = null;
		this.page = null;
		this.cookies = new CookieBank();
		this.RequestVerificationToken = '';
		this.xhrRequests = [];
		this.xhrResponse = [];
	}

	private async generateBrowser(): Promise<void> {
		if (!this.browser) {
			puppeteer.use(StealthPlugin());
			this.browser = await puppeteer.launch({
				headless: this.browserMode,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				defaultViewport: null,
			});
		}
	}

	private async generatePage(navigationTimeout: number): Promise<void> {
		if (this.browser && !this.page) {
			this.page = await this.browser.newPage();
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
	}

	async navigateToURL(
		url: URLs | { PartialBranchUrl: URLs.PartialBranchUrl; branchNumber: number }
	): Promise<void> {
		if (!this.browser) await this.generateBrowser();
		if (!this.page) await this.generatePage(this.navigationTimeout);
		if (typeof url === 'string') {
			await this.page?.goto(url);
		} else {
			await this.page?.goto(url.PartialBranchUrl + String(url.branchNumber));
		}
	}

	getXhrRequests() {
		return this.xhrRequests;
	}

	getXhrResponse() {
		return this.xhrResponse;
	}

	async extractHtmlToken(): Promise<string> {
		if (!this.browser) await this.generateBrowser();
		if (!this.page) await this.generatePage(this.navigationTimeout);
		const htmlContent = (await this.page?.content()) || '';
		const $ = cheerio.load(htmlContent);
		const RequestVerificationToken = $(
			'input[name="__RequestVerificationToken"]'
		).val();
		this.RequestVerificationToken = RequestVerificationToken;
		return RequestVerificationToken;
	}

	getSavedHtmlToken(): string {
		return this.RequestVerificationToken;
	}

	getSavedCookies(): ICookiesObject {
		return this.cookies.getCookies();
	}

	async extractAllCookies(): Promise<ICookiesObject> {
		if (!this.browser) await this.generateBrowser();
		if (!this.page) await this.generatePage(this.navigationTimeout);
		const cookies = await this.page?.cookies();
		// console.log('??? [PuppeteerBrowser] [extractAllCookies] Cookies: ', cookies);
		if (!cookies || !cookies.length)
			throw new PuppeteerMalfunctionError('extractAllCookies failed');

		return this.cookies.importPuppeteerCookies(cookies);
	}

	async closePageAndBrowser() {
		if (this.page) {
			await this.page.close();
			this.page = null;
		}
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}

	resetCookiesAndToken() {
		this.cookies = new CookieBank();
		this.RequestVerificationToken = '';
	}

	async end() {
		await this.closePageAndBrowser();
		this.resetCookiesAndToken();
	}
}
