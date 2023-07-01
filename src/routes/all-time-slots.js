const express = require('express');
const dotenv = require('dotenv');
const queryAllBranches = require('../js-build/typescript/scrape-old/QueryAllBranches');

dotenv.config();

const router = express.Router();

router.post('/api/scrape/all-time-slots', async (req, res, next) => {
	try {
		//* Get all branches.
		const { allBranches } = await queryAllBranches();
		console.log(`[Elastic] Branch query result amount: ${allBranches.length} `);
		const branchesBatches = helperSplitArrayIntoChunks(allBranches, 10);
		let counter = 0;
		let branchServicesDatesTimes = [];
		console.log('Bottom of the code');
	} catch (error) {
		next(error);
	}
});

module.exports = router;
