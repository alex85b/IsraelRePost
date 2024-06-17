import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from '../../../data/repositories/PostofficeBranchesRepository';
import {
	IPostofficeCodeIdPairsRepository,
	PostofficeCodeIdPairsRepository,
} from '../../../data/repositories/PostofficeCodeIdPairsRepository';

console.log('** Test Postoffice Code Id Pairs Repository **');

export const replaceUnprocessedQueue = async () => {
	console.log('** (1) Postoffice Code Id Pairs Repository | Replace Unprocessed Queue **');
	const branchesRepository: IPostofficeBranchesRepository = new PostofficeBranchesRepository();
	const pairs = await branchesRepository.getAllBranchesIdAndQnomyCode();
	console.log(
		'[replaceUnprocessedQueue] getAllBranchesIdAndQnomyCode pairs[0] : ',
		JSON.stringify(pairs[0], null, 3)
	);
	const codeIdPairsRepository: IPostofficeCodeIdPairsRepository =
		new PostofficeCodeIdPairsRepository();

	console.log('[replaceUnprocessedQueue] new PostofficeCodeIdPairsRepository()');

	console.log(
		'[replaceUnprocessedQueue]replaceUnprocessedQueue(pairs) : ',
		await codeIdPairsRepository.replaceUnprocessedQueue(pairs)
	);
	await codeIdPairsRepository.disconnect();
};

export const popPushPair = async () => {
	console.log('** (2) Postoffice Code Id Pairs Repository | Pop Push Pair **');

	const codeIdPairsRepository: IPostofficeCodeIdPairsRepository =
		new PostofficeCodeIdPairsRepository();

	console.log('[replaceUnprocessedQueue] new PostofficeCodeIdPairsRepository()');

	const popped = await codeIdPairsRepository.popUnprocessedPair();
	console.log('[replaceUnprocessedQueue] popUnprocessedPair : ', popped);
	if (!popped) {
		await codeIdPairsRepository.disconnect();
		return;
	}
	console.log(
		'[replaceUnprocessedQueue] pushProcessedPair : ',
		await codeIdPairsRepository.pushProcessedPair(popped)
	);
	await codeIdPairsRepository.disconnect();
};

export const popAllPairs = async () => {
	console.log('** (3) Postoffice Code Id Pairs Repository | Pop All Pairs **');
	const codeIdPairsRepository: IPostofficeCodeIdPairsRepository =
		new PostofficeCodeIdPairsRepository();

	console.log('[replaceUnprocessedQueue] new PostofficeCodeIdPairsRepository()');

	console.log(
		'[replaceUnprocessedQueue] popAllPairs : ',
		await codeIdPairsRepository.popAllPairs()
	);
	codeIdPairsRepository.disconnect();
};

// export const rePopulateUnprocessed = async () => {
// 	console.log('** (4) Postoffice Code Id Pairs Repository | Re-Populate Unprocessed **');

// 	const branchesRepository: IPostofficeBranchesRepository = new PostofficeBranchesRepository();

// 	const codeIdPairsRepository: IPostofficeCodeIdPairsRepository =
// 		new PostofficeCodeIdPairsRepository();

// 	const { processed: bProcessed, unprocessed: bUnprocessed } =
// 		await codeIdPairsRepository.popAllPairs();
// 	console.log('[rePopulateUnprocessed] Reset Queues - Pop :', {
// 		bProcessed: bProcessed.length,
// 		bUnprocessed: bUnprocessed.length,
// 	});

// 	console.log(
// 		'[rePopulateUnprocessed] Reset Queues - Push :',
// 		await codeIdPairsRepository.replaceUnprocessedQueue(
// 			await branchesRepository.getAllBranchesIdAndQnomyCode()
// 		)
// 	);

// 	console.log('[rePopulateUnprocessed] Pop then push few branches');
// 	for (let i = 0; i < 3; i++) {
// 		const pair = await codeIdPairsRepository.popUnprocessedPair();
// 		if (!pair) break;
// 		console.log(`[rePopulateUnprocessed] pair ${i} : `, pair);
// 		await codeIdPairsRepository.pushProcessedPair(pair);
// 	}

// 	console.log('[rePopulateUnprocessed] Pop without pushing few branches to simulate an Error');
// 	for (let i = 0; i < 5; i++) {
// 		console.log(
// 			`[rePopulateUnprocessed] pair ${i} : `,
// 			await codeIdPairsRepository.popUnprocessedPair()
// 		);
// 	}

// 	console.log('[rePopulateUnprocessed] Pop all the branches');
// 	const { processed, unprocessed } = await codeIdPairsRepository.popAllPairs();
// 	let rePopBranches = unprocessed.concat(processed);
// 	console.log('[rePopulateUnprocessed] unprocessed.concat(processed) : ', {
// 		rePopBranches: rePopBranches.length,
// 		rePopBranchesDemo: rePopBranches[0],
// 	});

// 	const idCodePairsWithErrors = await branchesRepository.getAllBranchesIdAndQnomyCodeExcluding(
// 		rePopBranches.map((branch) => branch.branchId)
// 	);

// 	if (idCodePairsWithErrors.length) {
// 		console.log(
// 			'[rePopulateUnprocessed] idCodePairsWithErrors : ',
// 			JSON.stringify(idCodePairsWithErrors, null, 3)
// 		);
// 		rePopBranches = idCodePairsWithErrors.concat(rePopBranches);
// 	}

// 	console.log('[rePopulateUnprocessed] rePopBranches length : ', rePopBranches.length);
// 	const replaceResponse = await codeIdPairsRepository.replaceUnprocessedQueue(rePopBranches);
// 	console.log('[replaceUnprocessedQueue] replaceUnprocessedQueue : ', replaceResponse);
// 	codeIdPairsRepository.disconnect();
// };
