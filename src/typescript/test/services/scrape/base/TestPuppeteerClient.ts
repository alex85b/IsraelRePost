import { URLs } from '../../../../common/urls';
import { PuppeteerBrowser } from '../../../../services/updateBranches/helpers/scrape/base/PuppeteerClient';
import { PuppeteerPostOfficeBranchesPage } from '../../../../services/updateBranches/helpers/scrape/base/PuppeteerPostOfficeBranchesPage';

console.log('** Test Puppeteer Client **');

export const newPage = async () => {
	console.log('** (1) PuppeteerBrowser newPage **');
	const browserInstance = PuppeteerBrowser.getInstance({ headless: 'new' });
	console.log('[newPage] browserInstance : ', browserInstance);
	if (!browserInstance) throw Error('[newPage] browserInstance is undefined ot null');
	const page = await browserInstance.getDefaultPage();
	console.log('[newPage] page : ', page);
	if (!page) throw Error('[newPage] page is undefined ot null');
	return { browser: browserInstance, page: page };
};

export const browserPage = async () => {
	console.log('** (2) PuppeteerPage browserPage **');

	const { page, browser } = await newPage();

	const browserPage = new PuppeteerPostOfficeBranchesPage({
		browserPage: page,
		navigationTimeout: 60000,
	});
	console.log('[browserPage] New PuppeteerPostOfficeBranchesPage');

	await browserPage.navigateToURL({ url: URLs.IsraelPostBranches, retries: 3 });
	console.log('[browserPage] extractHtmlToken : ', await browserPage.extractHtmlToken());

	try {
		const interceptedData = await browserPage.getInterceptedXHR();
		console.log('[browserPage] BranchListSource : ', interceptedData.BranchListSource);
		console.log('[browserPage] BranchListUpdateTime : ', interceptedData.BranchListUpdateTime);
		console.log(
			'[browserPage] branches-array demo : ',
			JSON.stringify(interceptedData.branches[0], null, 3)
		);
		browser.closeBrowserAndPages();
	} catch (error) {
		console.error('Error waiting for intercepted XHR:', error);
	}
};
