import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import path from "path";
import { splitBranchesArray } from "../common/SplitBranchesArray";
import { ManageWorkers } from "../scrape-multithreaded/ManageWorkers";
import { ElasticClient } from "../elastic/elstClient";

dotenv.config();

const router = express.Router();

router.post(
	"/api/scrape/all-time-slots",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Get a path to worker script.
			const workerPath = path.join(__dirname, "..", "scrape-multithreaded", "WorkerNew.js");
			const elasticClient = new ElasticClient();
			const allBranches = (await elasticClient.getAllBranchIndexRecords()) ?? [];
			console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);
			const branch = allBranches[0];
			// Split branches-array into array of arrays of X branches batch.
			const branchesBatches = splitBranchesArray(allBranches, 8);
			console.log(
				"[/api/scrape/all-time-slots] branch-batch size: ",
				branchesBatches[1].length
			);

			const proxyConfig = {
				proxyAuth: {
					password: process.env.PROX_PAS || "",
					username: process.env.PROX_USR || "",
				},
				proxyUrl: (process.env.PROX_ENDP || "") + ":" + (process.env.PROX_SPORT || ""),
				useProxy: true,
			};

			const manager = new ManageWorkers({
				proxyConfig: proxyConfig,
				workerScriptPath: workerPath,
				branchesBatch: branchesBatches[1],
				requestsLimit: 48,
				requestsTimeout: 61000,
				threadAmount: 4,
			});
			manager.constructWorkLoad();
			const workersStatus = await manager.spawnWorkers();
			const workersReport = await manager.workersScrapeBranches();
			// const runErrors = manager.getRunErrors();
			const remainingBranches = manager.getWorkLoadArray();

			res.status(200).send({ workersStatus, workersReport, remainingBranches });
		} catch (error) {
			console.log(error);
			next(error as Error);
		}
	}
);

export { router as TimeSlots };
