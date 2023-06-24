import { MakeRequest } from '../api-requests/make-request';
import { UserCreateAnonymous } from '../api-requests/user-create-anonymouse';
import { CookieBank } from '../common/cookie-bank';
import { ISingleBranchQueryResponse } from '../common/interfaces/IBranchQueryResponse';
import { URLs } from '../common/urls';
import { PuppeteerBrowser } from '../pptr/pptr-browser';

export const slotsRequestsSetup = async (
	randomBranch: ISingleBranchQueryResponse
) => {
	const puppeteerClient = new PuppeteerBrowser('new', 60000);
	try {
		const { _source } = randomBranch;
		const { branchnumber, branchnameEN } = _source;

		await puppeteerClient.navigateToURL({
			PartialBranchUrl: URLs.PartialBranchUrl,
			branchNumber: branchnumber,
		});
		const htmlToken = await puppeteerClient.extractHtmlToken();
		const cookieBank = new CookieBank();
		cookieBank.addCookies(await puppeteerClient.extractAllCookies());

		console.log(
			`### [slotsRequestsSetup] Extracted htmlToken and cookies from ${branchnameEN} branch ###`
		);

		return {
			htmlToken: htmlToken,
			cookieBank: cookieBank,
		};
	} catch (error) {
		throw error;
	} finally {
		puppeteerClient.end();
		console.log('### [slotsRequestsSetup] Browser and page are closed ###');
	}
};
