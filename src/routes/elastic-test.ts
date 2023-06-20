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

	const branchMockUp = {
		id: 1155,
		branchnumber: 3,
		branchname: 'ממ"ס- שוק סטוק',
		branchnameEN: 'Delivery Center - Stock Market',
		openstatus: 1,
		displaystatus: 1,
		branchtype: 13,
		telephone: null,
		fax: null,
		manager: null,
		qnomycode: 0,
		haszimuntor: 0,
		qnomyWaitTimeCode: 0,
		region: 3,
		area: 2,
		sector: 0,
		city: 'ראשון לציון',
		cityEN: 'Rishon Leziyyon',
		citycode: '1252',
		street: 'רוטשילד',
		streetEN: 'Rothschild',
		streetcode: '88862',
		house: 109,
		zip: '7520541',
		addressdesc: null,
		addressdescEN: null,
		geocode_latitude: 31.964627,
		geocode_longitude: 34.793665,
		createdDate: null,
		closedDate: null,
		Services: [
			{
				serviceid: 27,
			},
			{
				serviceid: 40,
			},
		],
		ExtraServices: [
			{
				extraserviceid: 1,
			},
			{
				extraserviceid: 2,
			},
			{
				extraserviceid: 3,
			},
		],
		accessibility: [
			{
				accessiblitytypeid: 1,
				value: 1,
			},
			{
				accessiblitytypeid: 2,
				value: 1,
			},
			{
				accessiblitytypeid: 3,
				value: 1,
			},
			{
				accessiblitytypeid: 4,
				value: 1,
			},
			{
				accessiblitytypeid: 5,
				value: 0,
			},
			{
				accessiblitytypeid: 6,
				value: 1,
			},
			{
				accessiblitytypeid: 7,
				value: 0,
			},
			{
				accessiblitytypeid: 8,
				value: 4,
			},
		],
		hours: [
			{
				dayofweek: 1,
				openhour1: '10:00:00',
				closehour1: '19:30:00',
				openhour2: null,
				closehour2: null,
			},
			{
				dayofweek: 2,
				openhour1: '10:00:00',
				closehour1: '19:30:00',
				openhour2: null,
				closehour2: null,
			},
			{
				dayofweek: 3,
				openhour1: '10:00:00',
				closehour1: '19:30:00',
				openhour2: null,
				closehour2: null,
			},
			{
				dayofweek: 4,
				openhour1: '10:00:00',
				closehour1: '19:30:00',
				openhour2: null,
				closehour2: null,
			},
			{
				dayofweek: 5,
				openhour1: '10:00:00',
				closehour1: '19:30:00',
				openhour2: null,
				closehour2: null,
			},
			{
				dayofweek: 6,
				openhour1: '10:00:00',
				closehour1: '14:30:00',
				openhour2: null,
				closehour2: null,
			},
			{
				dayofweek: 7,
				openhour1: null,
				closehour1: null,
				openhour2: null,
				closehour2: null,
			},
		],
		temphours: null,
		messages: null,
		showProductInventories: false,
		isMakeAppointment: false,
		generalMessage: null,
	};

	// const branchDocument: IBranchDocument = branchMockUp as IBranchDocument;
	// (branchDocument.location = {
	// 	lat: branchMockUp.geocode_latitude,
	// 	lon: branchMockUp.geocode_longitude,
	// }),
	// 	console.log(await client.deleteAllIndices());

	// console.log(await client.createAllBranchesIndex());

	// console.log(await client.addBranch(branchDocument));

	res.send('Done');
});

export { router as elasticTest };
