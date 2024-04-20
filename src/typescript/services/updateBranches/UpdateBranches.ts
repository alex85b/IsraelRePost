import { BranchServicesIndexing } from '../../api/elastic/branchServices/BranchServicesIndexing';
import {
	BulkCreateUpdateResponse,
	IBulkCreateUpdateResponse,
} from '../../data/models/dataTransferModels/elasticResponses/BulkCreateUpdateResponse';
import { filterByMakeAppointments } from './helpers/scrape/FilterBranches';
import { scrapeXhrObjects } from './helpers/scrape/ScrapeBranches';

export const addUpdateBranches = async () => {
	const branchesWithAppointments = await fetchNewBranches();
	const branchIndex = new BranchServicesIndexing();
	const rawBulkAddResponse = await branchIndex.bulkAddBranches({
		addBranches: branchesWithAppointments.map((branchRecord) =>
			branchRecord.getBranchDocumentCopy()
		),
	});
	const bulkAddResponse: IBulkCreateUpdateResponse = new BulkCreateUpdateResponse.Builder()
		.useAxiosResponse(rawBulkAddResponse)
		.build();
	console.log('[addUpdateBranches] bulkAddResponse : ', bulkAddResponse.countResponseItems());
	return {
		successful: bulkAddResponse.getSuccessful,
		failed: bulkAddResponse.getFailed,
	};
};

export const deleteAddBranches = async () => {
	const branchesWithAppointments = await fetchNewBranches();
	const branchIndex = new BranchServicesIndexing();
	await branchIndex.deleteAllBranches();
	const rawBulkAddResponse = await branchIndex.bulkAddBranches({
		addBranches: branchesWithAppointments.map((branchRecord) =>
			branchRecord.getBranchDocumentCopy()
		),
	});
	const bulkAddResponse: IBulkCreateUpdateResponse = new BulkCreateUpdateResponse.Builder()
		.useAxiosResponse(rawBulkAddResponse)
		.build();
	console.log('[deleteAddBranches] bulkAddResponse : ', bulkAddResponse.countResponseItems());
	return {
		successful: bulkAddResponse.getSuccessful,
		failed: bulkAddResponse.getFailed,
	};
};

const fetchNewBranches = async () => {
	const unfilteredBranches = await scrapeXhrObjects();
	return filterByMakeAppointments(unfilteredBranches);
};
