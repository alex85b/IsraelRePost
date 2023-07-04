const express = require('express');
const requestBranches = require('../js-build/scrape-old/RequestBranches');
const extractPageData = require('../js-build/scrape-old/ExtractPageData');
const URLs = require('../js-build/common/urls');
const persistBranches = require('../js-build/scrape-old/PersistBranches');
const CookieBank = require('../js-build/common/cookie-bank');

const router = express.Router();

// Get the whole branch list from Israel Post.
// This should be done infrequently
router.post('/api/scrape/all-branches', async (req, res, next) => {
	try {
		const { cookies, htmlToken } = await extractPageData(
			URLs.IsraelPostBranches,
			60000,
			true,
			true,
			true
		);

		const cookieBank = new CookieBank();
		cookieBank.addCookies(cookies);
		const { filteredBranches } = await requestBranches({
			cookieBank,
			htmlToken,
		});

		const { branches } = await persistBranches(true, filteredBranches);

		console.log('### bulkAddBranches : Done ###');

		res.status(200).send({ message: 'Done', data: branches });
	} catch (error) {
		console.error('### Error! ###');
		next(error);
	}
});

module.exports = router;
