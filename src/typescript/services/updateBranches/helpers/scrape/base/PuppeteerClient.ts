import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page, Browser, HTTPResponse, HTTPRequest } from "puppeteer";
import cheerio from "cheerio";

import {
	ConstructLogMessage,
	ILogMessageConstructor,
} from "../../../../../shared/classes/ConstructLogMessage";

const MODULE_NAME = "Puppeteer Client";

// #############################################################################################
// ### Basic Functions #########################################################################
// #############################################################################################

export const buildPuppeteerBrowser = async (
	headless: boolean | "shell"
): Promise<Browser> => {
	puppeteer.use(StealthPlugin());
	return puppeteer.launch({
		headless: headless,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-infobars",
			"--window-position=0,0",
			"--ignore-certifcate-errors",
			"--ignore-certifcate-errors-spki-list",
			"--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
		],
		defaultViewport: null,
		ignoreHTTPSErrors: true,
	});
};

export const buildPuppeteerPage = async (browser: Browser): Promise<Page> => {
	const pages = await browser.pages();
	return pages.length ? pages[0] : await browser.newPage();
};

export const navigateToUrl = async (args: {
	url: string;
	page: Page;
	logConstructor: ILogMessageConstructor;
}): Promise<void> => {
	args.logConstructor.addLogHeader("navigateToUrl");
	console.log(args.logConstructor.createLogMessage({ subject: "Start" }));
	try {
		await args.page.goto(args.url, {
			timeout: 120000,
			waitUntil: "networkidle0",
		});
		await args.page.waitForNetworkIdle({ timeout: 120000 }).catch(() => {
			console.log(
				args.logConstructor.createLogMessage({
					subject: "waiting for network idel has failed",
				})
			);
		});
	} finally {
		console.log(args.logConstructor.createLogMessage({ subject: "End" }));
		args.logConstructor.popLogHeader();
	}
};

export const extractHtmlToken = async (args: {
	page: Page;
}): Promise<string> => {
	const htmlContent = (await args.page.content()) || "";
	const $ = cheerio.load(htmlContent);
	const RequestVerificationToken =
		$('input[name="__RequestVerificationToken"]').val() || "";
	let requestVerificationToken: string;
	if (typeof RequestVerificationToken === "string") {
		requestVerificationToken = RequestVerificationToken;
	} else {
		requestVerificationToken = RequestVerificationToken[0];
	}
	return requestVerificationToken;
};

// #############################################################################################
// ### Capture Xhr #############################################################################
// #############################################################################################

export interface InterceptorResults {
	requests: HTTPRequest[];
	responses: HTTPResponse[];
}

export interface StringedInterceptorResults {
	requests: string[];
	responses: string[];
}

export type RequestHandler = (request: HTTPRequest) => Promise<boolean>;
export type ResponseHandler = (response: HTTPResponse) => Promise<boolean>;

export class NetworkTrafficCapture {
	private page: Page;
	private results: InterceptorResults = { requests: [], responses: [] };
	private strinedResults: StringedInterceptorResults = {
		requests: [],
		responses: [],
	};
	private isCapturing: boolean = false;
	private requestHandler: RequestHandler;
	private responseHandler: ResponseHandler;
	private logConstructor: ILogMessageConstructor;

	constructor(args: {
		page: Page;
		customRequestHandler?: RequestHandler;
		customResponseHandler?: ResponseHandler;
	}) {
		this.page = args.page;
		this.logConstructor = new ConstructLogMessage(["NetworkTrafficCapture"]);
		this.requestHandler =
			args.customRequestHandler || this.defaultRequestHandler;
		this.responseHandler =
			args.customResponseHandler || this.defaultResponseHandler;
	}

	private defaultRequestHandler: RequestHandler = (request: HTTPRequest) =>
		Promise.resolve(true);

	private defaultResponseHandler: ResponseHandler = (response: HTTPResponse) =>
		Promise.resolve(true);

	start() {
		if (!this.isCapturing) {
			this.isCapturing = true;
			this.results = { requests: [], responses: [] };
			this.strinedResults = { requests: [], responses: [] };
			this.page.on("request", this.handleRequest.bind(this));
			this.page.on("response", this.handleResponse.bind(this));
			console.log(
				this.logConstructor.createLogMessage({ subject: "Capture started" })
			);
		}
	}

	private async handleRequest(request: HTTPRequest) {
		const handlerApproves = await this.requestHandler(request);
		if (this.isCapturing && handlerApproves) {
			this.results.requests.push(request);
			try {
				this.strinedResults.requests.push(this.stringifyRequest(request));
			} catch (error) {}
			console.log(
				this.logConstructor.createLogMessage({
					subject: "Request captured",
					message: request.url(),
				})
			);
		}
	}

	private stringifyRequest(request: HTTPRequest): string {
		let requestBody = request.postData() ?? "";
		if (requestBody) {
			try {
				requestBody = JSON.parse(requestBody);
			} catch (jsonError) {
				this.logConstructor.createLogMessage({
					subject: "Failed to parse request body as JSON",
					message: (jsonError as Error).message,
				});
			}
		}
		return JSON.stringify({
			url: request.url(),
			method: request.method(),
			headers: request.headers(),
			body: requestBody,
		});
	}

	private async handleResponse(response: HTTPResponse) {
		const handlerApproves = await this.responseHandler(response);
		if (this.isCapturing && handlerApproves) {
			this.results.responses.push(response);
			try {
				this.strinedResults.responses.push(
					await this.stringifyResponse(response)
				);
			} catch (error) {}
			console.log(
				this.logConstructor.createLogMessage({
					subject: "Request captured",
					message: response.url(),
				})
			);
		}
	}

	private async stringifyResponse(response: HTTPResponse): Promise<string> {
		let responseBody;
		const contentType = response.headers()["content-type"];
		if (contentType && contentType.includes("application/json")) {
			try {
				responseBody = await response.json();
			} catch (jsonError) {
				this.logConstructor.createLogMessage({
					subject: "Failed to parse JSON, falling back to text",
					message: (jsonError as Error).message,
				});
				responseBody = await response.text();
			}
		} else {
			responseBody = await response.text();
		}

		return JSON.stringify({
			url: response.url(),
			status: response.status(),
			headers: response.headers(),
			body: responseBody,
		});
	}

	stop(): StringedInterceptorResults {
		if (this.isCapturing) {
			this.isCapturing = false;
			this.page.removeAllListeners("request");
			this.page.removeAllListeners("response");
			console.log(
				this.logConstructor.createLogMessage({ subject: "Capture stopped" })
			);
		}
		return this.strinedResults;
	}
}
// ####################################################################################################
// ### Depricated #####################################################################################
// ####################################################################################################

// export interface IPuppeteerBrowser {
// 	getDefaultPage(): Promise<Page>;
// 	closeBrowserAndPages(): Promise<void>;
// }

// export interface IPuppeteerPage {
// 	setCustomIntercept(
// 		onRequest: (interceptRequest: HTTPRequest) => Promise<void>,
// 		onResponse: (interceptResponse: HTTPResponse) => Promise<void>
// 	): Promise<void>;
// 	navigateToURL(ata: { url: URLs; retries: number }): Promise<void>;
// }

// export class PuppeteerBrowser implements IPuppeteerBrowser {
// 	private static instance: PuppeteerBrowser;
// 	private browser: Promise<Browser>;

// 	private constructor(args: { headless: boolean | "shell" }) {
// 		puppeteer.use(StealthPlugin());
// 		this.browser = puppeteer.launch({
// 			headless: args.headless,
// 			args: [
// 				"--no-sandbox",
// 				"--disable-setuid-sandbox",
// 				"--disable-infobars",
// 				"--window-position=0,0",
// 				"--ignore-certifcate-errors",
// 				"--ignore-certifcate-errors-spki-list",
// 				"--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
// 			],
// 			defaultViewport: null,
// 			ignoreHTTPSErrors: true,
// 		});
// 	}

// 	public static getInstance(buildData: {
// 		headless: boolean | "shell";
// 	}): PuppeteerBrowser {
// 		if (!PuppeteerBrowser.instance) {
// 			PuppeteerBrowser.instance = new PuppeteerBrowser(buildData);
// 		}
// 		return PuppeteerBrowser.instance;
// 	}

// 	async getDefaultPage(): Promise<Page> {
// 		const browser = await this.browser;
// 		const pages = await browser.pages();
// 		return pages[0];
// 	}

// 	async closeBrowserAndPages() {
// 		const browser = await this.browser;
// 		await browser.close();
// 	}
// }

// export class PuppeteerPage implements IPuppeteerPage {
// 	protected page: Page;

// 	constructor(buildData: { browserPage: Page }) {
// 		this.page = buildData.browserPage;
// 	}

// 	async setCustomIntercept(
// 		onRequest: (interceptRequest: HTTPRequest) => Promise<void>,
// 		onResponse: (interceptResponse: HTTPResponse) => Promise<void>
// 	) {
// 		await this.page.setRequestInterception(true);
// 		this.page.on("request", onRequest);
// 		this.page.on("response", onResponse);
// 	}

// 	async navigateToURL(args: {
// 		url: URLs;
// 		retries: number;
// 		navigationTimeout: number;
// 	}) {
// 		for (let i = 0; i < args.retries; i++) {
// 			try {
// 				console.log(`[${MODULE_NAME}][navigateToURL] Start navigation`);
// 				await this.page.goto(args.url, {
// 					timeout: args.navigationTimeout,
// 					waitUntil: "networkidle0",
// 				});
// 				console.log(`[${MODULE_NAME}][navigateToURL] Done navigation`);
// 				break;
// 			} catch (error) {
// 				const e = error as Error;
// 				console.log(`[${MODULE_NAME}][navigateToURL] Error : `, e.message);
// 			}
// 		}
// 	}
// }

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
