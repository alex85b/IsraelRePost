import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page, Browser, HTTPResponse, HTTPRequest } from 'puppeteer';
import { URLs } from '../../../../../common/urls';

const MODULE_NAME = 'Puppeteer Client';

// #############################################################################################
// ### New Implementation : IPuppeteerBrowser | IPuppeteerPage #################################
// #############################################################################################

export interface IPuppeteerBrowser {
	getDefaultPage(): Promise<Page>;
	closeBrowserAndPages(): Promise<void>;
}

export interface IPuppeteerPage {
	setCustomIntercept(
		onRequest: (interceptRequest: HTTPRequest) => Promise<void>,
		onResponse: (interceptResponse: HTTPResponse) => Promise<void>
	): Promise<void>;
	navigateToURL(ata: { url: URLs; retries: number }): Promise<void>;
}

export class PuppeteerBrowser implements IPuppeteerBrowser {
	private static instance: PuppeteerBrowser;
	private browser: Promise<Browser>;

	private constructor(buildData: { headless: true | false | 'new' }) {
		puppeteer.use(StealthPlugin());
		this.browser = puppeteer.launch({
			headless: buildData.headless,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
			defaultViewport: null,
		});
	}

	public static getInstance(buildData: { headless: true | false | 'new' }): PuppeteerBrowser {
		if (!PuppeteerBrowser.instance) {
			PuppeteerBrowser.instance = new PuppeteerBrowser(buildData);
		}
		return PuppeteerBrowser.instance;
	}

	async getDefaultPage(): Promise<Page> {
		const browser = await this.browser;
		const pages = await browser.pages();
		return pages[0];
	}

	async closeBrowserAndPages() {
		const browser = await this.browser;
		await browser.close();
	}
}

export class PuppeteerPage implements IPuppeteerPage {
	protected page: Page;

	constructor(buildData: { browserPage: Page; navigationTimeout: number }) {
		this.page = buildData.browserPage;
		this.page.setDefaultNavigationTimeout(buildData.navigationTimeout);
	}

	async setCustomIntercept(
		onRequest: (interceptRequest: HTTPRequest) => Promise<void>,
		onResponse: (interceptResponse: HTTPResponse) => Promise<void>
	) {
		await this.page.setRequestInterception(true);
		this.page.on('request', onRequest);
		this.page.on('response', onResponse);
	}

	async navigateToURL(data: { url: URLs; retries: number }) {
		for (let i = 0; i < data.retries; i++) {
			try {
				console.log(`[${MODULE_NAME}][navigateToURL] Start navigation`);
				await this.page.goto(data.url);
				console.log(`[${MODULE_NAME}][navigateToURL] Done navigation`);
				break;
			} catch (error) {
				const e = error as Error;
				console.log(`[${MODULE_NAME}][navigateToURL] Error : `, e.message);
			}
		}
	}
}

// #############################################################################################
// ### Response Object Interfaces ##############################################################
// #############################################################################################

export interface IXhrLoadBranches {
	branches: IXhrBranch[];
	BranchListSource: string;
	BranchListUpdateTime: null;
}

export interface IXhrBranch {
	id: number;
	branchnumber: number;
	branchname: string;
	branchnameEN: string;
	openstatus: number;
	displaystatus: number;
	branchtype: number;
	telephone: string | null;
	fax: string | null;
	manager: string | null;
	qnomycode: number;
	haszimuntor: number;
	qnomyWaitTimeCode: number;
	region: number;
	area: number;
	sector: number;
	city: string;
	cityEN: string;
	citycode: string;
	street: string;
	streetEN: string;
	streetcode: string;
	house: number;
	zip: string;
	addressdesc: string | null;
	addressdescEN: string | null;
	geocode_latitude: number;
	geocode_longitude: number;
	createdDate: string | null;
	modified_on: string;
	closedDate: string | null;
	Services: Service[] | null;
	ExtraServices: ExtraService[];
	accessibility: Accessibility[];
	hours: Hour[] | null;
	temphours: string | null;
	messages: string | null;
	showProductInventories: boolean;
	isMakeAppointment: boolean;
	generalMessage: string | null;
}

interface Service {
	serviceid: number;
}

interface ExtraService {
	extraserviceid: number;
}

interface Accessibility {
	accessiblitytypeid: number;
	value: number;
}

interface Hour {
	dayofweek: number;
	openhour1: string | null;
	closehour1: string | null;
	openhour2: string | null;
	closehour2: string | null;
}
