import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page, Browser, Protocol } from 'puppeteer';
import cheerio from 'cheerio'; // ? parse5 has better benchmark score. maybe switch to parse5.
import { CookieBank } from '../common/cookie-bank';
import { CookiesObject } from '../common/cookies-object-interface';

puppeteer.use(StealthPlugin());

// This represents the puppeteer automation that needed to scrape Israel-post.
export class PuppeteerBrowser {
	private browser: Browser | null;
	private page: Page | null;
	private browserMode: boolean | 'new';
	private cookies: CookieBank;
	private RequestVerificationToken: string;

	constructor(browserMode: boolean | 'new') {
		this.browser = null;
		this.page = null;
		this.browserMode = browserMode;
		this.cookies = new CookieBank();
		this.RequestVerificationToken = '';
	}

	async generateBrowser(): Promise<boolean> {
		if (!this.browser) {
			puppeteer.use(StealthPlugin());
			this.browser = await puppeteer.launch({
				headless: this.browserMode,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				defaultViewport: null,
			});
			return true;
		}
		return false;
	}

	async generatePage(): Promise<boolean> {
		if (this.browser && !this.page) {
			this.page = await this.browser.newPage();
			return true;
		}
		return false;
	}

	async navigateToURL(url: string): Promise<boolean> {
		if (this.page) {
			await this.page.goto(url);
			return true;
		}
		return false;
	}

	async extractHtmlToken(): Promise<string | false> {
		if (this.page) {
			const htmlContent = await this.page.content();
			const $ = cheerio.load(htmlContent);
			const RequestVerificationToken = $(
				'input[name="__RequestVerificationToken"]'
			).val();
			this.RequestVerificationToken = RequestVerificationToken;
			return RequestVerificationToken;
		}
		return false;
	}

	getSavedHtmlToken(): string | false {
		if (this.RequestVerificationToken !== '') {
			return this.RequestVerificationToken;
		}
		return false;
	}

	async extractAllCookies(): Promise<CookiesObject | false> {
		if (this.page) {
			const cookies = await this.page.cookies();
			return this.cookies.importPuppeteerCookies(cookies);
		}
		return false;
	}

	async waitThenSearchCookies(
		cookieName: string,
		msBeforeSearch: number
	): Promise<Protocol.Network.Cookie[] | false> {
		if (this.page) {
			return new Promise((resolve, reject) => {
				setTimeout(async () => {
					const allCookies = await this.page!.cookies(); // at this point, page can't be null.
					const targetCookie = allCookies.find(
						(cookie) => cookie.name === cookieName
					);
					if (targetCookie) resolve(allCookies);
					else reject(`cannot find ${cookieName}`);
				}, msBeforeSearch);
			});
		} else return false;
	}
}
