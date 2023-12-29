import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { splitBranchesArray } from '../common/SplitBranchesArray';
import { BranchModule } from '../elastic/BranchModel';

dotenv.config();

const router = express.Router();

router.post(
	'/api/scrape/all-time-slots',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			// const branches = new BranchModule();
			// const allBranches = (await branches.fetchAllBranches()) ?? [];

			// console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);
			// const branch = allBranches[10];
			// // Split branches-array into array of arrays of X branches batch.
			// const branchesBatches = splitBranchesArray(allBranches, 10);
			// console.log(
			// 	'[/api/scrape/all-time-slots] branch-batch size: ',
			// 	branchesBatches[0].length
			// );

			// const manager = new ManageWorkers({
			// 	branchesBatch: branchesBatches[0],
			// 	requestsLimit: 48,
			// 	requestsTimeout: 61000,
			// 	threadAmount: 10,
			// });

			// manager.constructWorkLoad();
			// const workersStatus = await manager.spawnWorkers();
			// const workersReport = await manager.workersScrapeBranches();
			// const remainingBranches = manager.getWorkLoadArray();

			// res.status(200).send({ workersStatus, workersReport, remainingBranches });
			res.status(200).send('Done - Empty');
		} catch (error) {
			console.log(error);
			next(error as Error);
		}
	}
);

export { router as TimeSlots };
