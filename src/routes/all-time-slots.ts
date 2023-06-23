import express, { Request, Response, NextFunction } from 'express';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { URLs } from '../common/urls';
import { MakeRequest } from '../api-requests/make-request';
import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { ElasticMalfunctionError } from '../errors/elst-malfunction-error';
import {
	SearchResponseBody,
	SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { UserCreateAnonymous } from '../api-requests/user-create-anonymouse';
import { CookieBank } from '../common/cookie-bank';
import { LocationGetServices } from '../api-requests/location-get-services';
import { IDocumentBranch } from '../common/interfaces/document-branch-interface';
import { IUserCreateAnonymousData } from '../common/interfaces/user-create-data-interface';
import { ILocationGetServices } from '../common/interfaces/get-services-interface';
import { SearchAvailableDates } from '../api-requests/search-avaliable-dates';
import { getTodayDateObject } from '../common/todays-date';
import { ISearchAvailableDatesData } from '../common/interfaces/search-dates-data-interface';
import { SearchAvailableSlots } from '../api-requests/search-available-slots';
import { ISearchDatesData } from '../common/interfaces/search-slots-data-interface';
import {
	ISODateTimeString,
	ITimeSlotsDocument,
} from '../common/interfaces/timeslots-document-interface';

dotenv.config();

const router = express.Router();

router.post(
	'/api/scrape/all-time-slots',
	async (req: Request, res: Response, next: NextFunction) => {
		const puppeteerClient = new PuppeteerBrowser('new');
		const cookieBank = new CookieBank();
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

			/*//* ########################################################### */
			/*//* Iterate branches list, for each branch do ################# */
			/*//* ########################################################### */

			// as a test - pick one branch from the results array.
			console.log('### Chosen result ### : ', results[0]);
			const testBranch = results[0]._source as IDocumentBranch;

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

			cookieBank.addCookies(await puppeteerClient.extractAllCookies());
			console.log('### Extract cookies from the browser: Done ###');

			// Generate a 'User' using UserCreateAnonymous api request.
			const UserCreateAnonymousResponse = await MakeRequest(
				new UserCreateAnonymous(
					cookieBank.getCookies(),
					requestVerificationTokenHtml
				)
			);
			console.log('### UserCreateAnonymous API request: Done ###');

			// Retrieve a JWT token from the data of User Create Anonymous request.
			const userDataToken = (
				UserCreateAnonymousResponse.data as IUserCreateAnonymousData
			).Results.token;
			console.log('### Retrieve a JWT token: Done ###');

			// Save new Cookies.
			cookieBank.importAxiosCookies(UserCreateAnonymousResponse.axiosCookies);

			// Get Branches services using the LocationGetServices API.
			const LocationGetServicesResponse = await MakeRequest(
				new LocationGetServices(cookieBank.getCookies(), userDataToken, {
					locationId: String(testBranch.qnomycode),
					serviceTypeId: '0',
				})
			);
			console.log('### LocationGetServices: Done ###');

			const LocationGetServicesResults = (
				LocationGetServicesResponse.data as ILocationGetServices
			).Results;

			/*//* ########################################################### */
			/*//* Iterate branch services, for each service do ############## */
			/*//* ########################################################### */

			const testServiceId = LocationGetServicesResults[0].serviceId;

			// Get branch-service's available Appointment-dates.
			const todaysDate = getTodayDateObject();
			const SearchAvailableDatesResponse = await MakeRequest(
				new SearchAvailableDates(cookieBank.getCookies(), userDataToken, {
					serviceId: String(testServiceId),
					startDate: {
						yyyy: todaysDate.year,
						mm: todaysDate.month,
						dd: todaysDate.day,
					},
				})
			);
			console.log('### SearchAvailableDates: Done ###');

			const SearchAvailableDatesResults = (
				SearchAvailableDatesResponse.data as ISearchAvailableDatesData
			).Results;
			console.log('SearchAvailableDates Data : ', SearchAvailableDatesResults);

			/*//* ########################################################### */
			/*//* Iterate branch service's dates, for each date do ########## */
			/*//* ########################################################### */

			const testCalendarDate = SearchAvailableDatesResults[0].calendarDate;

			/*//* ########################################################### */
			/*//* Get time slots ############################################ */
			/*//* ########################################################### */

			// Get time slots of a specific branch's service and date.
			const SearchAvailableSlotsResponse = await MakeRequest(
				new SearchAvailableSlots(cookieBank.getCookies(), userDataToken, {
					dayPart: '1',
					serviceId: String(testServiceId),
				})
			);

			const SearchAvailableSlotsResults = (
				SearchAvailableSlotsResponse.data as ISearchDatesData
			).Results;

			console.log('SearchAvailableSlots Results : ', SearchAvailableSlotsResults);

			/*//* ########################################################### */
			/*//* Write to DB ############################################### */
			/*//* ########################################################### */

			// test if Elasticsearch is up and running
			elasticClient.sendPing();

			// If time slots index doesn't exist ? create it.
			if (!elasticClient.timeSlotsIndexExists()) {
				elasticClient.createTimeSlotsIndex();
			}

			const addDocument: ITimeSlotsDocument = {
				branchKey: results[0]._id,
				BranchDate: testCalendarDate as ISODateTimeString,
				timeSlots: SearchAvailableSlotsResults,
			};

			const bulkAddSlotsResponse = await elasticClient.bulkAddSlots([addDocument]);
			console.log('### Done ###');

			/*//* ########################################################### */
			/*//* Return an indication of completion ######################## */
			/*//* ########################################################### */

			res.status(200).send(bulkAddSlotsResponse);
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
