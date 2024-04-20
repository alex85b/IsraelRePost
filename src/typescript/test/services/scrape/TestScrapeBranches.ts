import { scrapeXhrObjects } from '../../../services/updateBranches/helpers/scrape/ScrapeBranches';

console.log('** Test Scrape Branches **');

export const testScrapeXhrObjects = async () => {
	console.log('** (1) Test Scrape Xhr Objects **');
	const { branchRecords, htmlToken } = await scrapeXhrObjects();
	console.log('[testScrapeXhrObjects] branchRecords demo : ', branchRecords[0].toString());
	return branchRecords;
};
