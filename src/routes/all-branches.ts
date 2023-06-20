import express from 'express';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { URLs } from '../common/urls';
import { PuppeteerMalfunctionError } from '../errors/pptr-malfunction-error';
import { MakeRequest } from '../api-requests/make-request';
import { LoadBranchesBuilder } from '../api-requests/load-braches';
import { ElasticClient, IBranchDocument } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { IBranch } from '../elastic/interfaces/branch-interface';
dotenv.config();

const router = express.Router();

router.post('/api/scrape/all-branches', async (req, res) => {
	// Get the whole branch list from Israel Post.
	// This should be done infrequently.
	const puppeteerBranchScrape = new PuppeteerBrowser('new');
	let server_response = null;
	try {
		await puppeteerBranchScrape.generateBrowser();
		console.log('### Generate a headless browser: Done ###');

		await puppeteerBranchScrape.generatePage(15000);
		console.log('### Generate a page in the browser: Done ###');

		await puppeteerBranchScrape.navigateToURL(URLs.IsraelPostBranches);
		console.log("### Navigate to 'targetBranchURL': Done ###");

		const requestVerificationTokenHtml =
			await puppeteerBranchScrape.extractHtmlToken();
		console.log("### Extract a 'Token' that hidden in the HTML: Done ###");

		const cookieObj = await puppeteerBranchScrape.extractAllCookies();
		console.log('### Extract cookies from the browser: Done ###');

		if (!cookieObj || !requestVerificationTokenHtml) {
			throw new PuppeteerMalfunctionError('cannot create api requests');
		}

		server_response = await MakeRequest(
			new LoadBranchesBuilder(cookieObj, requestVerificationTokenHtml, '')
		);
		console.log('### Bring all branches : Done ###');

		// console.log(server_response.data);
	} catch (error) {
		console.error(error);
		throw new PuppeteerMalfunctionError('cannot retrieve the branch list');
	} finally {
		puppeteerBranchScrape.end();
		console.log('### Browser close: Done ###');
	}

	// Define the response to the LoadBranches server request.
	interface ILoadBranchesResponse {
		branches: IBranch[];
	}

	// Save the data for filtering.
	const branchesList = (server_response.data as ILoadBranchesResponse) || {};

	console.log(
		'### Dataset before filtering ### : ',
		Object.keys(branchesList.branches).length
	);

	// Filter out the all th kiosks and shops that only offer mail pickup services.
	// const filteredBranches: IBranch[] = branchesList.branches.filter(
	// 	(branch: IBranch) => {
	// 		if (branch.qnomycode !== 0) {
	// 			return true;
	// 		}
	// 		return false;
	// 	}
	// );

	const filteredBranches: IBranchDocument[] = branchesList.branches.reduce(
		(accumulator: IBranchDocument[], branch: IBranch) => {
			if (branch.qnomycode !== 0) {
				const newBranch: IBranchDocument = {
					...branch,
					location: {
						// This conforms to elastic's { type: 'geo_point' } mapping upon 'location'.
						lat: branch.geocode_latitude,
						lon: branch.geocode_longitude,
					},
				};
				accumulator.push(newBranch);
			}
			return accumulator;
		},
		[]
	);
	+console.log(
		'### Dataset after filtering ### : ',
		Object.keys(filteredBranches).length
	);

	// Calculate path to certificates.
	const certificatePath = path.join(
		__dirname,
		'..',
		'..',
		'elastic-cert',
		'http_ca.crt'
	);

	// Fetch certificates from local file.
	const certificateContents = fs.readFileSync(certificatePath, 'utf8');

	// Create a client.
	const client = new ElasticClient(
		'https://127.0.0.1:9200',
		'elastic',
		process.env.ELS_PSS || '',
		certificateContents,
		false
	);

	await client.deleteAllIndices();

	await client.createAllBranchesIndex();

	await client.bulkAddBranches(filteredBranches);

	res.status(200).send({ message: 'Done' });
});

export { router as ScrapeAllBranches };
