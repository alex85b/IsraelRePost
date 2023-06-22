import express, { Request, Response, NextFunction } from 'express';
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
import { ElasticMalfunctionError } from '../errors/elst-malfunction-error';
import {
	SearchResponseBody,
	SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { CookiesObject } from '../common/cookies-object-interface';
import { UserCreateAnonymous } from '../api-requests/user-create-anonymouse';
dotenv.config();

const router = express.Router();

router.post(
	'/api/scrape/all-time-slots',
	async (req: Request, res: Response, next: NextFunction) => {
		const puppeteerClient = new PuppeteerBrowser('new');
		let cookieObj: CookiesObject;
		let requestVerificationTokenHtml: string;
		try {
			/*//* ########################################################### */
			/*//* Get all branches form elastic ############################# */
			/*//* ########################################################### */

			// Calculate path to certificates.
			const certificatePath = path.join(
				__dirname,
				'..',
				'..',
				'elastic-cert',
				'http_ca.crt'
			);

			const certificateContents = fs.readFileSync(certificatePath, 'utf8');
			console.log('### Fetch certificates : Done ###');

			// Create a client.
			const elasticClient = new ElasticClient(
				'https://127.0.0.1:9200',
				'elastic',
				process.env.ELS_PSS || '',
				certificateContents,
				false
			);
			console.log('### Create a client : Done ###');

			if (!(await elasticClient.allBranchesIndexExists()))
				throw new ElasticMalfunctionError('All branches index does not exist');

			const branches: SearchResponseBody = await elasticClient.getAllBranches();
			console.log('### search all branches : Done ###');

			const resultsAmountObject = branches.hits.total;
			const resultsAmount = (resultsAmountObject as SearchTotalHits).value;
			console.log('### Result amount ### : ', resultsAmount);

			const results = branches.hits.hits;
			// console.log("### all branches ### : ", results);

			/*//* ########################################################### */
			/*//* Iterate branches list, for each branch do ################# */
			/*//* ########################################################### */

			// as a test - pick one branch from the results array.
			console.log('### Chosen result ### : ', results[0]);
			const testBranch = results[0]._source as IBranch;

			/*//* ########################################################### */
			/*//* Get Dates of time slots ################################### */
			/*//* ########################################################### */

			await puppeteerClient.generateBrowser();
			console.log('### Generate a headless browser: Done ###');

			await puppeteerClient.generatePage(60000);
			console.log('### Generate a page in the browser: Done ###');

			await puppeteerClient.navigateToURL({
				PartialBranchUrl: URLs.PartialBranchUrl,
				branchNumber: testBranch.branchnumber,
			});
			console.log("### Navigate to 'targetBranchURL': Done ###");

			requestVerificationTokenHtml =
				(await puppeteerClient.extractHtmlToken()) || '';
			console.log("### Extract a 'Token' that hidden in the HTML: Done ###");

			cookieObj = (await puppeteerClient.extractAllCookies()) || {};
			console.log('### Extract cookies from the browser: Done ###');

			if (!cookieObj || !requestVerificationTokenHtml) {
				throw new PuppeteerMalfunctionError('Token or cookies extraction failed');
			} else {
				console.log('Cookies: ', cookieObj);
				console.log('Token : ', requestVerificationTokenHtml);
			}

			// Generate a 'User' using api request.
			const server_response = await MakeRequest(
				new UserCreateAnonymous(cookieObj, requestVerificationTokenHtml, '')
			);

			console.log(server_response);

			console.log('### Bring all branches : Done ###');
			/*//* ########################################################### */
			/*//* Get time slots ############################################ */
			/*//* ########################################################### */

			/*//* ########################################################### */
			/*//* Write to DB ############################################### */
			/*//* ########################################################### */

			/*//* ########################################################### */
			/*//* Return an indication of completion ######################## */
			/*//* ########################################################### */

			res.status(200).send('All time slots works!');
		} catch (error) {
			console.error('### Error! ###');
			next(error);
		} finally {
			puppeteerClient.end();
			console.log('### Browser close: Done ###');
		}
	}
);

export { router as AllTimeSlots };
