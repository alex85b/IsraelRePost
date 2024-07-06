import express, { Request, Response, NextFunction } from 'express';
import { addUpdateBranches, deleteAddBranches } from '../services/updateBranches/UpdateBranches';

const router = express.Router();

// Get the whole branch list from Israel Post.
router.post('/api/scrape/all-branches', async (req: Request, res: Response, next: NextFunction) => {
	try {
		// TODO: This should depend on the request.
		res.status(200).send(await addUpdateBranches());
		// res.status(200).send(await deleteAddBranches());
	} catch (error) {
		console.error('[/api/scrape/all-branches] Error!');
		next(error);
	}
});

export { router as AllBranches };
