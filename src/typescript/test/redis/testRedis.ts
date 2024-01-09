import { BranchesToProcess } from '../../redis/BranchesToProcess';

export const testBranchesToProcess = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Branches To Process] Start');
	const branchesToProcess = new BranchesToProcess();
	console.log('[Test Branches To Process] Initialized');
	const dq = await branchesToProcess.dequeueBranch();
	console.log('[Test Branches To Process] .dequeueBranch()', dq);
	console.log('[Test Branches To Process] End');
};

export const testProcessedBranches = async (run: boolean) => {
	if (!run) return;
	console.log('[Test Processed Branches] Start');
	console.log('[Test Processed Branches] End');
};
