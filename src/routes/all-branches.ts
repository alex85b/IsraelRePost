import express, { Request, Response, NextFunction } from 'express';
import { requestBranches } from '../scrape/RequestBranches';
import { extractPageData } from '../scrape/ExtractPageData';
import { URLs } from '../common/urls';
import { persistBranches } from '../scrape/PersistBranches';
import { CookieBank } from '../common/cookie-bank';

const router = express.Router();

// Get the whole branch list from Israel Post.
// This should be done infrequently
router.post(
	'/api/scrape/all-branches',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { cookies, htmlToken } = await extractPageData(
				URLs.IsraelPostBranches,
				60000,
				true,
				true,
				true
			);

			const cookieBank = new CookieBank();
			cookieBank.addCookies(cookies);
			const { filteredBranches } = await requestBranches({
				cookieBank,
				htmlToken,
			});

			const { branches } = await persistBranches(true, filteredBranches);

			console.log('### bulkAddBranches : Done ###');

			res.status(200).send({ message: 'Done', data: branches });
		} catch (error) {
			console.error('### Error! ###');
			next(error);
		}
	}
);

export { router as ScrapeAllBranches };
