import {
	IPostofficeBranchesRepository,
	PostofficeBranchesRepository,
} from '../../../../data/repositories/PostofficeBranchesRepository';
import {
	IPostofficeCodeIdPairsRepository,
	PostofficeCodeIdPairsRepository,
} from '../../../../data/repositories/PostofficeCodeIdPairsRepository';
import { repopulateUnprocessedBranchesQueue } from '../../../../services/updateAppointments/helpers/queueSetup/PopulateRedisQueue';

console.log('** Test Populate Redis Queue **');

export const rePopulateUnprocessed = async () => {
	console.log('** (1) Test Populate Redis Queue | Re Populate Unprocessed **');

	const branchesRepository: IPostofficeBranchesRepository = new PostofficeBranchesRepository();
	const idCodePairRepository: IPostofficeCodeIdPairsRepository =
		new PostofficeCodeIdPairsRepository();

	const { processed: bProcessed, unprocessed: bUnprocessed } =
		await idCodePairRepository.popAllPairs();
	console.log('[rePopulateUnprocessed] idCodePairRepository - Pop :', {
		bProcessed: bProcessed.length,
		bUnprocessed: bUnprocessed.length,
	});

	console.log(
		'[rePopulateUnprocessed] Reset Queues - Push :',
		await idCodePairRepository.replaceUnprocessedQueue(
			await branchesRepository.getAllBranchesIdAndQnomyCode()
		)
	);

	console.log('[rePopulateUnprocessed] Pop then push few branches');
	for (let i = 0; i < 10; i++) {
		const pair = await idCodePairRepository.popUnprocessedPair();
		if (!pair) break;
		console.log(`[rePopulateUnprocessed] pair ${i} : `, pair);
		await idCodePairRepository.pushProcessedPair(pair);
	}

	// console.log('[rePopulateUnprocessed] Pop without pushing few branches to simulate an Error');
	// for (let i = 0; i < 3; i++) {
	// 	console.log(
	// 		`[rePopulateUnprocessed] pair ${i} : `,
	// 		await idCodePairRepository.popUnprocessedPair()
	// 	);
	// }

	const rePopResponse = await repopulateUnprocessedBranchesQueue({
		branchesRepository,
		idCodePairRepository,
	});

	console.log('[rePopulateUnprocessed] rePopResponse : ', rePopResponse);
	idCodePairRepository.disconnect();
};
