import express, { Request, Response, NextFunction } from 'express';
import { BranchModule } from '../elastic/BranchModule';

const router = express.Router();

router.get('/api/scrape/testing', async (req: Request, res: Response, next: NextFunction) => {
	const responses: any[] = [];
	try {
		const branchModule = new BranchModule();
		const qwe = await branchModule.fetchAllBranches();

		res.status(200).send(qwe);
	} catch (error) {
		console.log(error);
		next(error as Error);
	}
});

export { router as TestLab };
