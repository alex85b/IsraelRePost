import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page, Browser, Protocol, HTTPResponse } from 'puppeteer';
import cheerio from 'cheerio'; // ? parse5 has better benchmark score. maybe switch to parse5.
import { URLs } from '../common/urls';
import { IBranch } from '../interfaces/IBranch';

interface IXhrBranches {
	branches: IBranch[];
	BranchListSource: string;
	BranchListUpdateTime: null;
}

// This represents the puppeteer automation that needed to scrape Israel-post.
export class PuppeteerBrowser {
	private browser: Browser | null = null;
	private page: Page | null = null;
	private error: Error | null = null;

	private xhrRequests: {
		url: string;
		method: string;
		headers: Record<string, string>;
		postData: string | undefined;
	}[] = [];

	private xhrResponses: {
		url: string;
		status: number;
		headers: Record<string, string>;
		body: string;
	}[] = [];

	private branchesData: IXhrBranches | null = null;
	private RequestVerificationToken: string = '';

	constructor(private browserMode: boolean | 'new', private navigationTimeout: number) {}

	async generateBrowser(): Promise<void> {
		if (this.browser === null) {
			puppeteer.use(StealthPlugin());
			this.browser = await puppeteer.launch({
				headless: this.browserMode,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				defaultViewport: null,
			});
		}
	}

	async generatePage(pageData: {
		navigationTimeout: number;
		interceptBranches: boolean;
	}): Promise<void> {
		const { interceptBranches, navigationTimeout } = pageData;
		if (this.browser !== null) {
			if (this.page === null) {
				this.page = await this.browser.newPage();
				this.page.setDefaultNavigationTimeout(navigationTimeout);

				if (interceptBranches) {
					await this.page.setRequestInterception(true);
					this.page.on('request', (interceptedRequest) => {
						interceptedRequest.continue();
					});

					this.page.on('response', async (response: HTTPResponse) => {
						if (response.request().resourceType() === 'xhr') {
							if (
								response.url() ===
								'https://israelpost.co.il/umbraco/Surface/Branches/LoadBranches'
							) {
								this.branchesData = await response.json();
							}
						}
					});
				}

				console.log(
					`[PuppeteerBrowser] setDefaultNavigationTimeout: ${navigationTimeout} ###`
				);
			}
		}
	}

	async navigateToURL(url: URLs): Promise<void> {
		if (this.browser !== null) {
			if (this.page !== null) {
				await this.page.goto(url);
			}
		}
	}

	getBranchesFromXHR() {
		return this.branchesData;
	}

	async extractHtmlToken(): Promise<string> {
		if (this.page !== null) {
			if (this.browser !== null) {
				const htmlContent = (await this.page.content()) || '';
				const $ = cheerio.load(htmlContent);
				const RequestVerificationToken =
					$('input[name="__RequestVerificationToken"]').val() || '';
				if (typeof RequestVerificationToken === 'string') {
					this.RequestVerificationToken = RequestVerificationToken;
				} else {
					this.RequestVerificationToken = RequestVerificationToken[0];
				}
				return this.RequestVerificationToken;
			}
		}
		throw new Error("Can't extract HTML Token");
	}

	getSavedHtmlToken(): string {
		return this.RequestVerificationToken;
	}

	async closePageAndBrowser() {
		if (this.page !== null) {
			await this.page.close();
			this.page = null;
		}
		if (this.browser !== null) {
			await this.browser.close();
			this.browser = null;
		}
	}

	async end() {
		await this.closePageAndBrowser();
		// this.resetCookiesAndToken();
	}
}
