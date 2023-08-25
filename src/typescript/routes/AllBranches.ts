import express, { Request, Response, NextFunction } from "express";
import { URLs } from "../common/urls";
import { persistBranches } from "../scrape/PersistBranches";
import { PuppeteerBrowser } from "../puppeteer/pptr-browser";
import { filterBranches } from "../scrape/FilterBranches";
import { NotProvided } from "../errors/NotProvided";
import { readCertificates } from "../common/ReadCertificates";

const router = express.Router();

// Get the whole branch list from Israel Post.
// This should be done infrequently
router.post("/api/scrape/all-branches", async (req: Request, res: Response, next: NextFunction) => {
	const headlessBrowser = new PuppeteerBrowser(false, 60000);
	try {
		const certificateContents = readCertificates();
		const { attempts, errors, success, unfilteredBranches } = await getUnfilteredBranches(4);

		if (!success || !unfilteredBranches) throw errors[errors.length - 1];

		const filteredBranches = filterBranches(unfilteredBranches);

		const { persistResponse } = await persistBranches({
			certificateContents: certificateContents,
			doResetBranches: true,
			filteredBranches: filteredBranches,
		});

		res.status(200).send({
			message: "Done",
			persistedAmount: persistResponse.length ?? 0,
			persisted: persistResponse,
		});
	} catch (error) {
		console.error("[/api/scrape/all-branches] Error!");
		await headlessBrowser.end();
		next(error);
	}
});

export { router as AllBranches };

//* Helpers, consider moving all this to their own files.
const getUnfilteredBranches = async (retries: number) => {
	const headlessBrowser = new PuppeteerBrowser("new", 60000);
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
					resolve("Timeout done");
				}, 3000);
			});

			const loadBranchesData = headlessBrowser.getBranchesFromXHR();
			if (!loadBranchesData)
				throw new NotProvided({
					message: "branches are null",
					source: "getBranchesFromXHR",
				});
			await headlessBrowser.end();
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
