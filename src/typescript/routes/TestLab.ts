import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { ManageThreads } from '../scrape-multithreaded/new-scrape/ManageThreads';
import { queryAllBranches } from '../scrape-old/QueryAllBranches';
import { IBranchQueryResponse } from '../interfaces/IBranchQueryResponse';
import fs from 'fs';
import { splitBranchesArray } from '../common/SplitBranchesArray';

dotenv.config();

const router = express.Router();

router.get(
	'/api/scrape/testing',
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Get a path to worker script.
			const workerPath = path.join(
				__dirname,
				'..',
				'scrape-multithreaded',
				'new-scrape',
				'worker.js'
			);

			// Get a path to Elasticsearch certificates.
			const certificatePath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'elastic-cert',
				'http_ca.crt'
			);

			// Read the Certificates file.
			const certificateContents = fs.readFileSync(certificatePath, 'utf8');

			// Query Elasticsearch to get all the branches.
			const { allBranches } = await queryAllBranches(certificateContents);
			console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);

			// Split branches-array into array of arrays of X branches batch.
			const branchesBatches = splitBranchesArray(allBranches, 4);

			// Send a batch of branches for multithreaded execution.
			const manager = new ManageThreads(
				workerPath,
				48,
				61000,
				2,
				branchesBatches[1]
			);
			const promises = await manager.spawnWorkers();

			res.status(200).send(promises);
		} catch (error) {
			console.log(error);
			res.status(500).send({ Error: error });
		}
	}
);

export { router as TestLab };
