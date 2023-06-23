import express, { Request, Response, NextFunction } from 'express';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { URLs } from '../common/urls';
import { PuppeteerMalfunctionError } from '../errors/pptr-malfunction-error';
import { MakeRequest } from '../api-requests/make-request';
import { LoadBranchesBuilder } from '../api-requests/load-braches';
import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { IBranch } from '../common/interfaces/api-branch-interface';
import { IDocumentBranch } from '../common/interfaces/document-branch-interface';

dotenv.config();

const router = express.Router();

// Get the whole branch list from Israel Post.
// This should be done infrequently
router.post(
	'/api/scrape/all-branches',
	async (req: Request, res: Response, next: NextFunction) => {
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
				new LoadBranchesBuilder(cookieObj, undefined, undefined, {
					__RequestVerificationToken: requestVerificationTokenHtml,
				})
			);
			console.log('### Bring all branches : Done ###');

			// Define the response to the LoadBranches server request.
			interface ILoadBranchesResponse {
				branches: IBranch[];
			}

			// Cast the data for filtering.
			const branchesList = (server_response.data as ILoadBranchesResponse) || {};

			console.log(
				'### Dataset before filtering ### : ',
				Object.keys(branchesList.branches).length
			);

			// Filter out the all th kiosks and shops that only offer mail pickup services.
			const filteredBranches: IDocumentBranch[] = branchesList.branches.reduce(
				(accumulator: IDocumentBranch[], branch: IBranch) => {
					if (branch.qnomycode !== 0) {
						const newBranch: IDocumentBranch = {
							id: branch.id,
							branchnumber: branch.branchnumber,
							branchname: branch.branchname,
							branchnameEN: branch.branchnameEN || '',
							city: branch.city,
							cityEN: branch.cityEN || '',
							street: branch.street,
							streetEN: branch.streetEN || '',
							streetcode: branch.streetcode || '',
							zip: branch.zip,
							qnomycode: branch.qnomycode,
							qnomyWaitTimeCode: branch.qnomyWaitTimeCode,
							haszimuntor: branch.haszimuntor,
							isMakeAppointment: branch.haszimuntor,
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
			console.log('### Filter and transform branch-list : Done ###');

			console.log(
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
			console.log('### Fetch certificates : Done ###');

			// Create a client.
			const client = new ElasticClient(
				'https://127.0.0.1:9200',
				'elastic',
				process.env.ELS_PSS || '',
				certificateContents,
				false
			);

			await client.deleteAllIndices();
			console.log('### deleteAllIndices : Done ###');

			await client.createAllBranchesIndex();
			console.log('### createAllBranchesIndex : Done ###');

			const branches = await client.bulkAddBranches(filteredBranches);
			console.log('### bulkAddBranches : Done ###');

			res.status(200).send({ message: 'Done', data: branches });
		} catch (error) {
			console.error('### Error! ###');
			next(error);
		} finally {
			puppeteerBranchScrape.end();
			console.log('### Browser close: Done ###');
		}
	}
);

export { router as ScrapeAllBranches };
