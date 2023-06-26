import { URLs } from '../common/urls';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { NotProvided } from '../errors/NotProvided';
import { CookieBank } from '../common/cookie-bank';
// import dotenv from 'dotenv';

export interface ILoadBranchesSetup {
	cookieObj: ICookiesObject;
	htmlToken: string;
}

export const extractPageData = async (
	url: URLs | { PartialBranchUrl: URLs.PartialBranchUrl; branchNumber: number },
	navigationTimeout: number,
	doExtractHtml: boolean,
	doExtractCookies: boolean,
	doClosePuppeteer: boolean
) => {
	const puppeteerClient = new PuppeteerBrowser('new', navigationTimeout);
	try {
		await puppeteerClient.navigateToURL(url);
		const cookieBank = new CookieBank();
		let htmlToken = '';

		if (doExtractHtml) {
			htmlToken = await puppeteerClient.extractHtmlToken();
			if (!htmlToken || htmlToken.length === 0) {
				throw new NotProvided({
					message: 'No token provided',
					source: 'extractHtmlToken',
				});
			}
		}

		if (doExtractCookies) {
			const cookies = await puppeteerClient.extractAllCookies();
			console.log('??? [extractPageData] [doExtractCookies] cookies: ', cookies);
			if (Object.keys(cookies).length === 0) {
				throw new NotProvided({
					message: 'No cookies provided',
					source: 'extractAllCookies',
				});
			}
			cookieBank.addCookies(cookies);
			console.log(
				'??? [extractPageData] [doExtractCookies] cookieBank: ',
				cookieBank.getCookies()
			);
		}

		if (doClosePuppeteer) puppeteerClient.end();

		console.error('### [extractPageData] Done ###');
		return {
			cookies: cookieBank.getCookies(),
			htmlToken: htmlToken,
			puppeteer: puppeteerClient,
		};
	} catch (error) {
		puppeteerClient.end();
		console.error('### [extractPageData] Error ###');
		throw error;
	}
};
