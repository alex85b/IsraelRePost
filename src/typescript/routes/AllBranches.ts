import express, { Request, Response, NextFunction } from 'express';
import { URLs } from '../common/urls';
import { PuppeteerBrowser } from '../puppeteer/pptr-browser';
import { filterBranches } from '../scrape/FilterBranches';
import { BranchModule } from '../elastic/BranchModel';

const router = express.Router();

// Get the whole branch list from Israel Post.
// This should be done infrequently
router.post('/api/scrape/all-branches', async (req: Request, res: Response, next: NextFunction) => {
	const headlessBrowser = new PuppeteerBrowser(false, 60000);
	try {
		const { attempts, errors, success, unfilteredBranches } = await getUnfilteredBranches(4);
		if (!success || !unfilteredBranches) throw errors[errors.length - 1];
		const branches = filterBranches(unfilteredBranches);
		// const elastic = new ElasticClient();
		const branchModel = new BranchModule();
		const newRecords = (await branchModel.bulkAddBranches(branches)) ?? [];
		res.status(200).send({
			message: 'Done',
			persistedAmount: newRecords.length,
			persisted: newRecords,
		});
	} catch (error) {
		console.error('[/api/scrape/all-branches] Error!');
		await headlessBrowser.end();
		next(error);
	}
});

export { router as AllBranches };

//* Helpers, consider moving all this to a dedicated file.
const getUnfilteredBranches = async (retries: number) => {
	const headlessBrowser = new PuppeteerBrowser('new', 60000);
	const errors: Error[] = [];
	let index = 1;
	for (index; index <= retries; index++) {
		try {
			await headlessBrowser.generateBrowser();
			await headlessBrowser.generatePage({
				navigationTimeout: 60000,
				interceptBranches: true,
			});

			await headlessBrowser.navigateToURL(URLs.IsraelPostBranches);
			await new Promise((resolve) => {
				setTimeout(() => {
					resolve('Timeout done');
				}, 3000);
			});

			const loadBranchesData = headlessBrowser.getBranchesFromXHR();
			await headlessBrowser.end();
			if (!loadBranchesData) throw new Error('No branches from XHR Object');
			const unfilteredBranches = loadBranchesData.branches;
			return {
				success: true,
				unfilteredBranches: unfilteredBranches,
				errors: errors,
				attempts: index,
			};
		} catch (error) {
			errors.push(error as Error);
		}
	}
	return {
		success: false,
		unfilteredBranches: null,
		errors: errors,
		attempts: index,
	};
};
