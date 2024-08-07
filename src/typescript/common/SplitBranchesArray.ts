import { ISingleBranchQueryResponse } from "../api/elastic/branchServices/BranchServicesIndexing";

export const splitBranchesArray = (
	branchesArray: ISingleBranchQueryResponse[],
	chunkSize: number
) => {
	const result = [];
	for (let i = 0; i < branchesArray.length; i += chunkSize) {
		result.push(branchesArray.slice(i, i + chunkSize));
	}
	console.log("[splitArray] Done");
	return result;
};
