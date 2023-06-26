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
dotenv.config();

const router = express.Router();

router.get('/api/scrape/elastic', async (req, res) => {
	//? how can israel post know i'm me ?
	// Launch a browser.

	const browser = new PuppeteerBrowser('new', 60000);
	await browser.navigateToURL({
		PartialBranchUrl: URLs.PartialBranchUrl,
		branchNumber: 678,
	});

	const cookieBank = new CookieBank();

	cookieBank.addCookies(await browser.extractAllCookies());
	const bHtmlToken = await browser.extractHtmlToken();
	// browser.getSavedCookies();
	// browser.getSavedHtmlToken();

	try {
		const userCreateAnonymous = new UserCreateAnonymous();
		const userGetInfo = new UserGetInfo();
		const locationGetServices = new LocationGetServices();

		const anonymousResponse = await userCreateAnonymous.makeRequest();
		cookieBank.addCookies(anonymousResponse.cookies);

		const infoResponse = await userGetInfo.makeRequest(
			cookieBank.getCookies(),
			undefined,
			{ token: anonymousResponse.data['token'] }
		);

		const servicesResponse = await locationGetServices.makeRequest(
			cookieBank.getCookies(),
			{ locationId: '278', serviceTypeId: '0' },
			{ token: anonymousResponse.data['token'] }
		);

		const servicesResults = locationGetServices.getResponseArray();

		res
			.status(200)
			.send({
				infoResponse,
				anonymousResponse,
				servicesResponse,
				servicesResults,
			});
	} catch (error) {
		res.status(500).send(error);
	}
});

export { router as elasticTest };
