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

router.get('/api/scrape/elastic', async (req, res) => {
	try {
		//* Get all branches.

		const certificatePath = path.join(
			__dirname,
			'..',
			'..',
			'elastic-cert',
			'http_ca.crt'
		);

		const certificateContents = fs.readFileSync(certificatePath, 'utf8');

		const { allBranches } = await queryAllBranches(certificateContents);
		console.log(`[Elastic] Branch query result amount: ${allBranches.length} `);
		const allBranchesSplit = splitArray(allBranches, 5);
		// const branchesBatches = helperSplitArrayIntoChunks(allBranches, 10);
		// let counter = 0;
		// const branchServicesDatesTimes: ITimeSlotsDocument[] = [];
		const resultBatch = await handleWorkerThreads(allBranchesSplit[0]);

		console.log('Bottom of the code');

		res.status(200).send(resultBatch);
	} catch (error) {
		console.log(error);
		res.status(500).send('Error');
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
