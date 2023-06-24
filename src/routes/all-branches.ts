import express, { Request, Response, NextFunction } from 'express';
import { requestBranches } from '../scrape/RequestBranches';
import { loadBranchesSetup } from '../scrape/LoadBranchesSetup';

const router = express.Router();

// Get the whole branch list from Israel Post.
// This should be done infrequently
router.post(
	'/api/scrape/all-branches',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { cookieObj, elasticClient, htmlToken } = await loadBranchesSetup();
			const { filteredBranches } = await requestBranches({ cookieObj, htmlToken });

			await elasticClient.deleteAllIndices();
			console.log('### deleteAllIndices : Done ###');

			await elasticClient.createAllBranchesIndex();
			console.log('### createAllBranchesIndex : Done ###');

			const branches = await elasticClient.bulkAddBranches(filteredBranches);
			console.log('### bulkAddBranches : Done ###');
			res.status(200).send({ message: 'Done', data: branches });
		} catch (error) {
			console.error('### Error! ###');
			next(error);
		}
	}
);

export { router as ScrapeAllBranches };
