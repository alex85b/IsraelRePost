import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page, Browser, Protocol } from 'puppeteer';
import cheerio from 'cheerio'; // ? parse5 has better benchmark score. maybe switch to parse5.
import { CookieBank } from '../common/cookie-bank';
import { URLs } from '../common/urls';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';

// puppeteer.use(StealthPlugin());

export interface SpecificBranchObject {
	PartialBranchUrl: URLs.PartialBranchUrl;
	branchNumber: number;
}

// This represents the puppeteer automation that needed to scrape Israel-post.
export class PuppeteerBrowser {
	private browser: Browser | null;
	private page: Page | null;
	private cookies: CookieBank;
	private RequestVerificationToken: string;

	constructor(
		private browserMode: boolean | 'new',
		private navigationTimeout: number
	) {
		this.browser = null;
		this.page = null;
		this.cookies = new CookieBank();
		this.RequestVerificationToken = '';
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
			console.log(`### setDefaultNavigationTimeout: ${navigationTimeout} ###`);
		}
	}

	async navigateToURL(url: URLs | SpecificBranchObject): Promise<void> {
		if (!this.browser) await this.generateBrowser();
		if (!this.page) await this.generatePage(this.navigationTimeout);
		if (typeof url === 'string') {
			await this.page?.goto(url);
		} else {
			await this.page?.goto(url.PartialBranchUrl + String(url.branchNumber));
		}
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
		const cookies =
			(await this.page?.cookies()) || ([] as Protocol.Network.Cookie[]);
		return this.cookies.importPuppeteerCookies(cookies);
	}

	// async waitThenSearchCookie(
	// 	cookieName: string,
	// 	msBeforeSearch: number
	// ): Promise<Protocol.Network.Cookie[] | false> {
	// 	if (this.page) {
	// 		return new Promise((resolve, reject) => {
	// 			setTimeout(async () => {
	// 				const allCookies = await this.page!.cookies(); // at this point, page can't be null.
	// 				const targetCookie = allCookies.find(
	// 					(cookie) => cookie.name === cookieName
	// 				);
	// 				if (targetCookie) resolve(allCookies);
	// 				else reject(`cannot find ${cookieName}`);
	// 			}, msBeforeSearch);
	// 		});
	// 	} else return false;
	// }

	closePageAndBrowser() {
		if (this.page) {
			this.page.close();
			this.page = null;
		}
		if (this.browser) {
			this.browser.close();
			this.browser = null;
		}
	}

	resetCookiesAndToken() {
		this.cookies = new CookieBank();
		this.RequestVerificationToken = '';
	}

	end() {
		this.closePageAndBrowser();
		this.resetCookiesAndToken();
	}
}
