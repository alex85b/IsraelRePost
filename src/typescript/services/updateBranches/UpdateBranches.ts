import { useInterceptorResults } from "../../data/models/persistenceModels/PostofficeBranchRecord";
import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from "../../data/repositories/PostofficeBranchesRepository";
import { ConstructLogMessage } from "../../shared/classes/ConstructLogMessage";
import { filterByMakeAppointments } from "./helpers/scrape/FilterBranches";
import { scrapeBrowserResponses } from "./helpers/scrape/ScrapeBranches";

export const addUpdateBranches = async () => {
	const filteredBranches = await fetchNewBranches();

	const branchRepo: IPostofficeBranchesRepository =
		new PostofficeBranchesRepository();

	const bulkAddResponse = await branchRepo.writeUpdateBranches(
		filteredBranches
	);

	console.log(
		"[addUpdateBranches] bulkAddResponse : ",
		bulkAddResponse.countResponseItems()
	);
	return {
		successful: bulkAddResponse.getSuccessful(),
		failed: bulkAddResponse.getFailed(),
	};
};

export const deleteAddBranches = async () => {
	const branchesWithoutAppointments = await fetchNewBranches();

	const branchRepo: IPostofficeBranchesRepository =
		new PostofficeBranchesRepository();

	const bulkAddResponse = await branchRepo.deleteWriteBranches(
		branchesWithoutAppointments
	);

	console.log(
		"[deleteAddBranches] bulkAddResponse : ",
		bulkAddResponse.countResponseItems()
	);
	return {
		successful: bulkAddResponse.getSuccessful(),
		failed: bulkAddResponse.getFailed(),
	};
};

const fetchNewBranches = async () => {
	const responses = await scrapeBrowserResponses();
	const branchRecords = await useInterceptorResults({
		intercepted: responses,
		logConstructor: new ConstructLogMessage(["fetchNewBranches"]),
	});
	return filterByMakeAppointments({ branchRecords });
};
