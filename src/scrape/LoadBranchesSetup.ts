import { URLs } from '../common/urls';
import { ICookiesObject } from '../common/interfaces/ICookiesObject';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { ElasticClient } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import { NotProvided } from '../errors/NotProvided';
// import dotenv from 'dotenv';

export interface ILoadBranchesSetup {
	cookieObj: ICookiesObject;
	htmlToken: string;
}

export const loadBranchesSetup = async () => {
	const puppeteerClient = new PuppeteerBrowser('new', 15000);
	try {
		await puppeteerClient.navigateToURL(URLs.IsraelPostBranches);
		const htmlToken = await puppeteerClient.extractHtmlToken();
		const cookieObj = await puppeteerClient.extractAllCookies();
		console.log(
			'### [loadBranchesSetup] Extracted htmlToken and cookies from branches landing page ###'
		);

		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);
		const certificateContents = fs.readFileSync(certificatePath, 'utf8');

		const elasticClient = new ElasticClient(
			'https://127.0.0.1:9200',
			'elastic',
			process.env.ELS_PSS || '',
			certificateContents,
			false
		);

		elasticClient.sendPing();
		console.log('### [loadBranchesSetup] Elastic is up and running ###');

		if (!htmlToken)
			throw new NotProvided({
				message: 'No token provided',
				source: 'extractHtmlToken',
			});

		if (Object.keys(cookieObj).length === 0)
			throw new NotProvided({
				message: 'No cookies provided',
				source: 'extractAllCookies',
			});

		return {
			cookieObj: cookieObj,
			htmlToken: htmlToken,
			elasticClient: elasticClient,
		};
	} catch (error) {
		throw error;
	} finally {
		puppeteerClient.end();
		console.log('### [loadBranchesSetup] Browser and page are closed ###');
	}
};
