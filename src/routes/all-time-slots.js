const express = require('express');
const dotenv = require('dotenv');
const {
	handleWorkerThreads,
} = require('../js-build/scrape-multithreaded/ManageWorkerThreads');
const { queryAllBranches } = require('../js-build/scrape-old/QueryAllBranches');
const path = require('path');
const fs = require('fs');
const { log } = require('console');

dotenv.config();

const router = express.Router();

router.post('/api/scrape/all-time-slots', async (req, res, next) => {
	try {
		//* Get a path to Elasticsearch certificates.
		//* ////////////////////////////////////////
		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);

		//* Read the Certificates file.
		//* //////////////////////////
		const certificateContents = fs.readFileSync(certificatePath, 'utf8');

		//* Query Elasticsearch to get all the branches.
		//* ///////////////////////////////////////////
		const { allBranches } = await queryAllBranches(certificateContents);
		const rejects = [];
		console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);

		//* Split branches-array into array of arrays of X branches batch.
		//* /////////////////////////////////////////////////////////////
		const branchesBatches = splitArray(allBranches, 40);

		//* Send a batch of branches for multithreaded execution.
		//* ////////////////////////////////////////////////////

		// console.log(process.env.PROX_END_P1);
		// console.log(process.env.PROX_USR);
		// console.log(process.env.PROX_PAS);
		const resultBatch = await handleWorkerThreads(
			branchesBatches[0],
			true,
			process.env.PROX_END_P1 || '',
			process.env.PROX_USR || '',
			process.env.PROX_PAS || '',
			30000
		);

		resultBatch.forEach((result) => {
			console.log('forEach: ');
			if (result.status !== 'fulfilled') {
				rejects.push(result.reason.branch);
			}
		});

		console.log('rejects: ', rejects);
		console.log('Bottom of the code');
		res.status(200).send(resultBatch);
	} catch (error) {
		// console.log(error);
		// next(error);
		res.status(500).send({ Error: error });
	}
});

const splitArray = (branchesArray, chunkSize) => {
	const result = [];
	for (let i = 0; i < branchesArray.length; i += chunkSize) {
		result.push(branchesArray.slice(i, i + chunkSize));
	}
	console.log('[/api/scrape/elastic] [splitArray] Done');
	return result;
};

module.exports = router;
