import express from 'express';

const router = express.Router();

router.post('/api/scrape/scrape-periodically', (req, res) => {
	res.status(200).send({ message: 'Scrape works' });
});

export { router as ScrapePeriodically };
