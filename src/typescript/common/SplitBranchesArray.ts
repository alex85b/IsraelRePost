import { IBranchQueryResponse } from '../interfaces/IBranchQueryResponse';

export const splitBranchesArray = (
	branchesArray: IBranchQueryResponse,
	chunkSize: number
) => {
	const result = [];
	for (let i = 0; i < branchesArray.length; i += chunkSize) {
		result.push(branchesArray.slice(i, i + chunkSize));
	}
	console.log('[splitArray] Done');
	return result;
};
