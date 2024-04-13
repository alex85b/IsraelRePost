import { PostofficeBranchesRepository } from '../../../../data/repositories/PostofficeBranchesRepository';

console.log('** Test Postoffice Branches Repository **');

export const getAllBranches = async () => {
	console.log('** (1) Postoffice Branches Repository | Get All Branches **');
	const bRepo = new PostofficeBranchesRepository();
	const allBranches = await bRepo.getAllBranches();
	console.log('[getAllBranches] allBranches demo : ', allBranches[0].toString());
};
