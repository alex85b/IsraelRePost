import express from 'express';
import { PuppeteerBrowser } from '../pptr/pptr-browser';
import { URLs } from '../common/urls';
import { PuppeteerMalfunctionError } from '../errors/pptr-malfunction-error';
import { MakeRequest } from '../api-requests/make-request';
import { LoadBranchesBuilder } from '../api-requests/load-braches';
import { ElasticClient, IBranchDocument } from '../elastic/elstClient';
import * as path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { IBranch } from '../elastic/interfaces/branch-interface';
dotenv.config();

const router = express.Router();

router.post('/api/scrape/all-time-slots', async (req, res) => {
	//* Get all branches form elastic.

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
	console.log('### Fetch certificates : Done ###');

	// Create a client.
	const client = new ElasticClient(
		'https://127.0.0.1:9200',
		'elastic',
		process.env.ELS_PSS || '',
		certificateContents,
		false
	);

	await client.allBranchesExists();
	//client.getAllBranches();

	//* Iterate branches list, for each branch do:

	//* Get Dates of time slots.

	//* Get time slots.

	//* Write to DB

	//* Return an indication of completion.

	res.status(200).send('All time slots works!');
});

export { router as AllTimeSlots };
