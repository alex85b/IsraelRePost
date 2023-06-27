import express from 'express';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { ElasticClient } from '../elastic/elstClient';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { Browser } from 'puppeteer';
import { URLs } from '../common/urls';
import { UserCreateAnonymous } from '../api-requests/new/UserCreateAnonymous';
import { UserGetInfo } from '../api-requests/new/UserGetInfo';
import { CookieBank } from '../common/cookie-bank';
import { LocationGetServices } from '../api-requests/new/LocationGetServices';
import { SearchAvailableDates } from '../api-requests/new/SearchAvailableDates';
import { SearchAvailableSlots } from '../api-requests/new/SearchAvailableSlots';
dotenv.config();

const router = express.Router();

router.get('/api/scrape/elastic', async (req, res) => {
	//? how can israel post know i'm me ?

	let api_error_counter = 0;
	let run_browser = 3;
	let browser: PuppeteerBrowser | null = null;

	try {
		for (let index = 0; index < 350; index++) {
			try {
				if (index % 10 === 0) {
					// while (run_browser) {
					// 	try {
					// 		console.log(`[Start] browser setup, index${index}`);
					// 		browser = new PuppeteerBrowser('new', 60000);
					// 		await browser.navigateToURL({
					// 			PartialBranchUrl: URLs.PartialBranchUrl,
					// 			branchNumber: 678,
					// 		});
					// 		console.log(`[Start] browser up`);
					// 		break;
					// 	} catch (error) {
					// 		run_browser = run_browser - 1;
					// 		console.log(`[Error] browser reset, resets left ${run_browser}`);
					// 		if (run_browser === 0) {
					// 			throw error;
					// 		}
					// 	}
					// }
				}

				if (/*browser instanceof PuppeteerBrowser*/ true) {
					// const browser_cookies = await browser.extractAllCookies();
					// const browser_token = await browser.extractHtmlToken();

					const userCreateAnonymous = new UserCreateAnonymous();
					const userGetInfo = new UserGetInfo();
					const locationGetServices = new LocationGetServices();
					const searchAvailableDates = new SearchAvailableDates();
					const searchAvailableSlots = new SearchAvailableSlots();

					const anonymousResponse = await userCreateAnonymous.makeRequest();
					const infoResponse = await userGetInfo.makeRequest(
						{
							ARRAffinity: anonymousResponse.cookies.ARRAffinity,
							ARRAffinitySameSite: anonymousResponse.cookies.ARRAffinitySameSite,
							CentralJWTCookie: anonymousResponse.cookies.CentralJWTCookie,
							GCLB: anonymousResponse.cookies.GCLB,
						},
						{ token: anonymousResponse.data.token }
					);

					const servicesResponse = await locationGetServices.makeRequest(
						{
							ARRAffinity: anonymousResponse.cookies.ARRAffinity,
							ARRAffinitySameSite: anonymousResponse.cookies.ARRAffinitySameSite,
							CentralJWTCookie: anonymousResponse.cookies.CentralJWTCookie,
							GCLB: anonymousResponse.cookies.GCLB,
						},
						{ locationId: '278', serviceTypeId: '0' },
						{ token: anonymousResponse.data.token }
					);

					const datesResponse = await searchAvailableDates.makeRequest(
						{
							ARRAffinity: anonymousResponse.cookies.ARRAffinity,
							ARRAffinitySameSite: anonymousResponse.cookies.ARRAffinitySameSite,
							GCLB: anonymousResponse.cookies.GCLB,
						},
						{ serviceId: servicesResponse.nested[0].serviceId, startDate: 'IDK' },
						{ token: anonymousResponse.data.token }
					);

					const hoursResponse = await searchAvailableSlots.makeRequest(
						{
							ARRAffinity: anonymousResponse.cookies.ARRAffinity,
							ARRAffinitySameSite: anonymousResponse.cookies.ARRAffinitySameSite,
							GCLB: anonymousResponse.cookies.GCLB,
						},
						{
							CalendarId: datesResponse.nested[0].calendarId,
							dayPart: '0',
							ServiceId: servicesResponse.nested[0].serviceId,
						},
						{ token: anonymousResponse.data.token }
					);

					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log({
						// browserCookies: browser_cookies,
						// browserHtmToken: browser_token,
						anonymousResponse,
						infoResponse,
						servicesResponse,
						datesResponse,
						hoursResponse,
					});
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
					console.log('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
				}
			} catch (error) {
				api_error_counter = api_error_counter + 1;
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('');
				console.log(`[Error] api error: ${error}`);
				console.log(`[Error] api error, error count: ${api_error_counter}`);
				console.log('');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
				console.log('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
			}
		}
		res.send('Done');
	} catch (error) {
		res.status(500).send(error);
	}
});

export { router as elasticTest };
