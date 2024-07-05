import { IPostofficeBranchesRepository } from "../../../../data/repositories/PostofficeBranchesRepository";
import { IPostofficeCodeIdPairsRepository } from "../../../../data/repositories/PostofficeCodeIdPairsRepository";

export const repopulateUnprocessedBranchesQueue = async (data: {
	branchesRepository: IPostofficeBranchesRepository;
	idCodePairRepository: IPostofficeCodeIdPairsRepository;
}) => {
	const { processed, unprocessed } =
		await data.idCodePairRepository.popAllPairs();
	let rePopulate = unprocessed.concat(processed);
	const erroredDuringUpdate =
		await data.branchesRepository.getAllBranchesIdAndQnomyCodeExcluding(
			rePopulate.map((brach) => brach.branchId)
		);
	if (erroredDuringUpdate.length)
		rePopulate = erroredDuringUpdate.concat(rePopulate);
	return await data.idCodePairRepository.replaceUnprocessedQueue(rePopulate);
};
