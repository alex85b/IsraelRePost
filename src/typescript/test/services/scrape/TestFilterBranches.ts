import { filterByMakeAppointments } from '../../../services/updateBranches/helpers/scrape/FilterBranches';
import { testScrapeXhrObjects } from './TestScrapeBranches';

console.log('** Test Filter Branches **');

export const testFilterByMakeAppointments = async () => {
	console.log('** (1) Test Filter By Make Appointments **');
	const unfiltered = await testScrapeXhrObjects();
	const filteredBranchRecords = await filterByMakeAppointments({ branchRecords: unfiltered });
	console.log(
		'[testFilterByMakeAppointments] filteredBranchRecords count : ',
		filteredBranchRecords.length
	);
	console.log(
		'[testFilterByMakeAppointments] filteredBranchRecords demo : ',
		filteredBranchRecords[0].toString()
	);
};
