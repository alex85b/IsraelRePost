// import { BranchModule } from '../../data/elastic/BranchModel';
// import { BranchesToProcess } from '../../data/redis/BranchesToProcess';
// import { ProcessedBranches } from '../../data/redis/ProcessedBranches';

// /**
//  * Method to set up queues for processing branches.
//  * @returns An object containing information about the setup.
//  */
// const setupQueues = async () => {
// 	const branchesModule = new BranchModule();

// 	// Populate Redis-cloud queue with branches that needs update:

// 	// 1. Dequeue Unhandled branches.
// 	const processQueue = new BranchesToProcess();
// 	const unhandledBranches = await processQueue.dequeueBranches();

// 	// 2. Dequeue Completed branches.
// 	const doneQueue = new ProcessedBranches();
// 	const processedBranches = await doneQueue.dequeueBranches();

// 	// 3. Generate an array of known branch ID's.
// 	const branchIds = unhandledBranches.concat(processedBranches).map((pair) => pair.branchId);

// 	// 4. Query for all the branches that are not in some queue (Failures).
// 	const notInQueues = await branchesModule.exclusiveQnomyCodes(branchIds);

// 	// 5. Reconstruct the data for 'Process Queue': [Failures][Unprocessed][processed].
// 	const enqueueBranches = notInQueues.concat(unhandledBranches).concat(processedBranches);

// 	// 6. Enqueue Branches To Update.
// 	const enqueuedAmount = await processQueue.enqueueBranches(enqueueBranches);

// 	// return { notInQueues, processedBranches, unhandledBranches, enqueuedAmount };
// 	console.log('[Test Redis][setupQueues] setupResponse : ', {
// 		notInQueues,
// 		processedBranches,
// 		unhandledBranches,
// 		enqueuedAmount,
// 	});
// };

// export const testBranchesToProcess = async (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Branches To Process] Start');

// 	await setupQueues();
// 	console.log('[Test Branches To Process] Performed a queue setup');

// 	const branchesToProcess = new BranchesToProcess();
// 	console.log('[Test Branches To Process] Initialized');
// 	const dq = await branchesToProcess.dequeueBranch();
// 	console.log('[Test Branches To Process] .dequeueBranch()', dq);
// 	console.log('[Test Branches To Process] End');
// };

// export const testProcessedBranches = async (run: boolean) => {
// 	if (!run) return;
// 	console.log('[Test Processed Branches] Start');
// 	await setupQueues();
// 	console.log('[Test Branches To Process] Performed a queue setup');
// 	console.log('[Test Branches To Process] No implementation!');
// 	console.log('[Test Processed Branches] End');
// };
