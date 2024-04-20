import {
	IPostofficeBranchRecord,
	PostofficeBranchRecord,
} from '../../../../data/models/persistenceModels/PostofficeBranchRecord';
import { IPuppeteerBrowser, PuppeteerBrowser } from './base/PuppeteerClient';
import {
	IPuppeteerPostOfficeBranchesPage,
	PuppeteerPostOfficeBranchesPage,
} from './base/PuppeteerPostOfficeBranchesPage';

const MODULE_NAME = 'Scrape Branches';

export const scrapeXhrObjects = async () => {
	const browserInstance: IPuppeteerBrowser = PuppeteerBrowser.getInstance({ headless: 'new' });
	const postOfficeBranchesPage: IPuppeteerPostOfficeBranchesPage =
		new PuppeteerPostOfficeBranchesPage({
			browserPage: await browserInstance.getDefaultPage(),
			navigationTimeout: 60000,
		});

	await postOfficeBranchesPage.navigateToBranchesPage();
	const htmlToken = await postOfficeBranchesPage.extractHtmlToken();
	const branchesXHR = await postOfficeBranchesPage.getInterceptedXHR(60000);
	if (!branchesXHR.branches)
		throw Error(`[${MODULE_NAME}] Israel Post-office branch scrape returned no branches`);
	const branchRecords: IPostofficeBranchRecord[] = branchesXHR.branches.map((xhr) => {
		return new PostofficeBranchRecord.Builder()
			.useXhrLoadBranches({ rawXhrObject: xhr })
			.build();
	});
	if (!branchRecords.length)
		throw Error(`[${MODULE_NAME}] XHR Branch objects failed conversion to Branch-records`);
	await browserInstance.closeBrowserAndPages();
	return { branchRecords, htmlToken };
};
