import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from '../../data/repositories/PostofficeBranchesRepository';
import { filterByMakeAppointments } from './helpers/scrape/FilterBranches';
import { scrapeXhrObjects } from './helpers/scrape/ScrapeBranches';

export const addUpdateBranches = async () => {
	const branchesWithoutAppointments = await fetchNewBranches();
	const branchRepo: IPostofficeBranchesRepository = new PostofficeBranchesRepository();
	const bulkAddResponse = await branchRepo.writeUpdateBranches(branchesWithoutAppointments);
	console.log('[addUpdateBranches] bulkAddResponse : ', bulkAddResponse.countResponseItems());
	return {
		successful: bulkAddResponse.getSuccessful(),
		failed: bulkAddResponse.getFailed(),
	};
};

export const deleteAddBranches = async () => {
	const branchesWithoutAppointments = await fetchNewBranches();
	const branchRepo: IPostofficeBranchesRepository = new PostofficeBranchesRepository();
	const bulkAddResponse = await branchRepo.deleteWriteBranches(branchesWithoutAppointments);
	console.log('[deleteAddBranches] bulkAddResponse : ', bulkAddResponse.countResponseItems());
	return {
		successful: bulkAddResponse.getSuccessful(),
		failed: bulkAddResponse.getFailed(),
	};
};

const fetchNewBranches = async () => {
	const unfilteredBranches = await scrapeXhrObjects();
	return filterByMakeAppointments(unfilteredBranches);
};
