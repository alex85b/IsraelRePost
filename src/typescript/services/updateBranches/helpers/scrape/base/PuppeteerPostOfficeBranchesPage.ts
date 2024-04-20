import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import cheerio from 'cheerio';
import { Subject } from 'rxjs';
import { PuppeteerPage, IXhrLoadBranches, IPuppeteerPage } from './PuppeteerClient';
import { URLs } from '../../../../../common/urls';

const BRANCHES_XHR_RESPONSE_URL = 'https://israelpost.co.il/umbraco/Surface/Branches/LoadBranches';

export interface IPuppeteerPostOfficeBranchesPage extends IPuppeteerPage {
	extractHtmlToken(): Promise<string>;
	getInterceptedXHR(timeout: number): Promise<IXhrLoadBranches>;
	navigateToBranchesPage(): Promise<void>;
}

export class PuppeteerPostOfficeBranchesPage
	extends PuppeteerPage
	implements IPuppeteerPostOfficeBranchesPage
{
	private interceptedSubject = new Subject<IXhrLoadBranches>();
	private requestVerificationToken: string | string[] = '';

	constructor(buildData: { browserPage: Page; navigationTimeout: number }) {
		super({
			browserPage: buildData.browserPage,
			navigationTimeout: buildData.navigationTimeout,
		});

		this.setInterceptAllBranchesXHR();
	}

	private setInterceptAllBranchesXHR() {
		super.setCustomIntercept(
			async (interceptedRequest: HTTPRequest) => {
				interceptedRequest.continue();
			},
			async (interceptResponse: HTTPResponse) => {
				if (interceptResponse.request().resourceType() === 'xhr') {
					if (interceptResponse.url() === BRANCHES_XHR_RESPONSE_URL) {
						console.log(
							`[browserPage][setInterceptAllBranchesXHR] Attempted interception`
						);
						const interceptedData = await interceptResponse.json();
						this.interceptedSubject.next(interceptedData);
						console.log(
							`[browserPage][setInterceptAllBranchesXHR] Successfully intercepted`
						);
					}
				}
			}
		);
	}

	async extractHtmlToken(): Promise<string> {
		const htmlContent = (await this.page.content()) || '';
		const $ = cheerio.load(htmlContent);
		const RequestVerificationToken = $('input[name="__RequestVerificationToken"]').val() || '';
		if (typeof RequestVerificationToken === 'string') {
			this.requestVerificationToken = RequestVerificationToken;
		} else {
			this.requestVerificationToken = RequestVerificationToken[0];
		}
		return this.requestVerificationToken;
	}

	async navigateToBranchesPage(): Promise<void> {
		await super.navigateToURL({ url: URLs.IsraelPostBranches, retries: 3 });
	}

	async getInterceptedXHR(timeout: number = 60000): Promise<IXhrLoadBranches> {
		return new Promise((resolve, reject) => {
			// Set up a ticking time-out bomb that performs reject.
			const timeoutId = setTimeout(() => {
				subscription.unsubscribe();
				reject(new Error('Timeout waiting for intercepted XHR'));
			}, timeout);

			// Notice results that populated 'this.interceptedSubject'.
			const subscription = this.interceptedSubject.subscribe({
				next: (interceptedData: IXhrLoadBranches) => {
					clearTimeout(timeoutId);
					subscription.unsubscribe();
					resolve(interceptedData);
				},
				error: (error) => {
					clearTimeout(timeoutId);
					subscription.unsubscribe();
					reject(error);
				},
				complete: () => {
					clearTimeout(timeoutId);
					subscription.unsubscribe();
					reject(new Error('Observable completed without intercepted XHR'));
				},
			});
		});
	}
}
