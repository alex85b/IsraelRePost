import express from 'express';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import { ElasticClient, IBranchDocument } from '../elastic/elstClient';

const router = express.Router();

router.get('/api/scrape/elastic', async (req, res) => {
	// Calculate path to certificates.
	const certificatePath = path.join(
		__dirname,
		'..',
		'..',
		'elastic-cert',
		'http_ca.crt'
	);

	// Fetch certificates from local file.
	const certificateContents = fs.readFileSync(certificatePath, 'utf8');

	// Create a client.
	const client = new ElasticClient(
		'https://127.0.0.1:9200',
		'elastic',
		process.env.ELS_PSS || '',
		certificateContents,
		false
	);

	// Find my location.
	const myLat = 32.02155;
	const myLong = 34.74766;

	// Find all branches within 5km from my location,
	// Using the special transport query that shows how many records were checked.
	client.TEST_BranchSpatialIndexing(myLat, myLong);

	res.send('Done');
});

export { router as elasticTest };
