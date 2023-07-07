import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import {
	manageWorkerThreads,
	ManageWorkerThreads,
} from '../scrape-multithreaded/NewManageWorkerThreads';
import { queryAllBranches } from '../scrape-old/QueryAllBranches';
import path from 'path';
import fs from 'fs';
import { IBranchQueryResponse } from '../interfaces/IBranchQueryResponse';

dotenv.config();

const router = express.Router();

router.post(
	'/api/scrape/all-time-slots',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			//* Get a path to Elasticsearch certificates.
			//* ////////////////////////////////////////
			const certificatePath = path.join(
				__dirname,
				'..',
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
			let threadManagerArguments: ManageWorkerThreads = {
				branches: branchesBatches[3],
				useProxy: true,
				endpointUrl: process.env.PROX_ENDP || '',
				endpointUsername: process.env.PROX_USR || '',
				endpointPassword: process.env.PROX_PAS || '',
				portRangeStart: Number.parseInt(process.env.PROX_SPORT || '0'),
				portRangeEnd: Number.parseInt(process.env.PROX_EPORT || '0'),
				timeout: 30000,
			};
			const resultBatch = await manageWorkerThreads(threadManagerArguments);

			// resultBatch.forEach((result) => {
			// 	if (result.status !== 'fulfilled') {
			// 		rejects.push(result.reason.branch);
			// 	}
			// });

			// console.log('rejects: ', rejects);
			console.log('Bottom of the code');
			res.status(200).send(resultBatch);
		} catch (error) {
			// console.log(error);
			// next(error);
			res.status(500).send({ Error: error });
		}
	}
);

const splitArray = (branchesArray: IBranchQueryResponse, chunkSize: number) => {
	const result = [];
	for (let i = 0; i < branchesArray.length; i += chunkSize) {
		result.push(branchesArray.slice(i, i + chunkSize));
	}
	console.log('[/api/scrape/elastic] [splitArray] Done');
	return result;
};

export { router as TimeSlots };
