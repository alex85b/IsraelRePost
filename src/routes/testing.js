const express = require('express');
const dotenv = require('dotenv');
const { queryAllBranches } = require('../js-build/scrape-old/QueryAllBranches');
const path = require('path');
const fs = require('fs');
const {
	UserCreateAnonymous,
} = require('../js-build/api-requests/UserCreateAnonymous');
const {
	buildRequest,
	makeRequest,
} = require('../js-build/api-requests/ProxyTestAnonUser');
const { log } = require('console');
const axios = require('axios');

dotenv.config();

const router = express.Router();

router.get('/api/scrape/testing', async (req, res, next) => {
	try {
		// console.log('@@@ Here!');
		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);

		const certificateContents = fs.readFileSync(certificatePath, 'utf8');
		const { allBranches } = await queryAllBranches(certificateContents);
		console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);

		/*//* ##################################################################################################################### */
		/*//* ##################################################################################################################### */
		/*//* ##################################################################################################################### */
		/*//* ##################################################################################################################### */

		// const { HttpsProxyAgent } = require('https-proxy-agent');

		// const url = 'https://ip.smartproxy.com/json';
		// const httpsAgent = new HttpsProxyAgent(
		// 	'http://spqejf32bn:kcin1BkcpNIHul110t@gate.smartproxy.com:7000'
		// );

		// const response = await axios
		// 	.get(url, {
		// 		httpsAgent,
		// 	})
		// 	.then((response) => {
		// 		console.log(response.data);
		// 	});

		// console.log(response);

		const proxyUrl = 'http://gate.smartproxy.com:7000'; // Replace with your actual proxy URL
		const proxyAuth = {
			username: 'spqejf32bn', // Replace with your actual username
			password: 'kcin1BkcpNIHul110t', // Replace with your actual password
		};

		// const buildConfig = buildRequest(proxyUrl, proxyAuth);
		// console.log(buildConfig);

		const server_response = await makeRequest(proxyUrl, proxyAuth);

		res.status(200).send(server_response);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

// const splitArray = (branchesArray, chunkSize) => {
// 	const result = [];
// 	for (let i = 0; i < branchesArray.length; i += chunkSize) {
// 		result.push(branchesArray.slice(i, i + chunkSize));
// 	}
// 	console.log('[/api/scrape/elastic] [splitArray] Done');
// 	return result;
// };

module.exports = router;
