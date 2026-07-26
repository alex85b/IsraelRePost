import { useInterceptorResults } from "../../data/models/persistenceModels/PostofficeBranchRecord";
import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from "../../data/repositories/PostofficeBranchesRepository";
import { IPathTracker, PathStack } from "../../shared/classes/PathStack";
import { ILogger, WinstonClient } from "../../shared/classes/WinstonClient";
import { filterByMakeAppointments } from "./helpers/scrape/FilterBranches";
import { scrapeBrowserResponses } from "./helpers/scrape/ScrapeBranches";

const MODULE_NAME = "Update Branches";
const pathStack: IPathTracker = new PathStack().push(MODULE_NAME);
const logger: ILogger = new WinstonClient({ pathStack });

export const addUpdateBranches = async () => {
	pathStack.push("Add update Branches");
	const filteredBranches = await fetchNewBranches();
	const branchRepo: IPostofficeBranchesRepository =
		new PostofficeBranchesRepository();

	const bulkAddResponse = await branchRepo.writeUpdateBranches(
		filteredBranches
	);

	logger.logInfo({
		message: "Performed, Response is",
		details: bulkAddResponse.countResponseItems(),
	});
	pathStack.pop();
	return {
		successful: bulkAddResponse.getSuccessful(),
		failed: bulkAddResponse.getFailed(),
	};
};

export const deleteAddBranches = async () => {
	pathStack.push("Delete add Branches");
	const branchesWithoutAppointments = await fetchNewBranches();
	const branchRepo: IPostofficeBranchesRepository =
		new PostofficeBranchesRepository();

	const bulkAddResponse = await branchRepo.deleteWriteBranches(
		branchesWithoutAppointments
	);

	logger.logInfo({
		message: "Performed, Response is",
		details: bulkAddResponse.countResponseItems(),
	});

	return {
		successful: bulkAddResponse.getSuccessful(),
		failed: bulkAddResponse.getFailed(),
	};
};

const fetchNewBranches = async () => {
	const responses = await scrapeBrowserResponses();
	const branchRecords = await useInterceptorResults({
		intercepted: responses,
	});
	return filterByMakeAppointments({ branchRecords });
};
