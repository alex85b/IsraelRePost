import { BranchServicesIndexing } from '../../../api/elastic/branchServices/BranchServicesIndexing';

console.log('** Test Branch Services Indexing **');

export const construct = () => {
	console.log('** (1) new BranchServicesIndexing **');
	const bServicesIndex = new BranchServicesIndexing();
	if (!bServicesIndex)
		throw Error('[construct] Test Failed, BranchServicesIndexing is null  undefined');
	else console.log('[construct] BranchServicesIndexing is not null / undefined');
	return bServicesIndex;
};

export const fetchAllBranches = async () => {
	console.log('** (2) BranchServicesIndexing.fetchAllBranches **');
	const bServicesIndex = construct();
	const allBranches = await bServicesIndex.fetchAllBranches();
	if (!Array.isArray(allBranches))
		throw Error('[fetchAllBranches] Test Failed, fetchAllBranches response is not array');
	console.log('[fetchAllBranches] allBranches length : ', allBranches.length);
	console.log('[fetchAllBranches] allBranches demo : ', JSON.stringify(allBranches[0]));
};

export const branchesWithoutServices = async () => {
	console.log('** (3) BranchServicesIndexing.branchesWithoutServices **');
	const bServicesIndex = construct();
	const bWithoutServices = await bServicesIndex.branchesWithoutServices();
	if (!Array.isArray(bWithoutServices))
		throw Error(
			'[branchesWithoutServices] Test Failed, branchesWithoutServices response is not array'
		);
	console.log('[branchesWithoutServices] bWithoutServices length : ', bWithoutServices.length);
	console.log(
		'[branchesWithoutServices] bWithoutServices demo : ',
		JSON.stringify(bWithoutServices[0])
	);
};
