const express = require('express');
const dotenv = require('dotenv');
const {
	handleWorkerThreads,
} = require('../multithreading/handleWorkerThreads');
const {
	queryAllBranches,
} = require('../js-build/typescript/scrape-old/QueryAllBranches');
const path = require('path');
const fs = require('fs');

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
		console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);

		//* Split branches-array into array of arrays of X branches batch.
		//* /////////////////////////////////////////////////////////////
		const branchesBatches = splitArray(allBranches, 5);

		//* Send a batch of branches for multithreaded execution.
		//* ////////////////////////////////////////////////////
		const resultBatch = await handleWorkerThreads(branchesBatches[0]);

		console.log('Bottom of the code');
		res.status(200).send(resultBatch);
	} catch (error) {
		console.log(error);
		next(error);
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
