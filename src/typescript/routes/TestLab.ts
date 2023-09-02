import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { ElasticClient, INewServiceRecord } from "../elastic/elstClient";
import { Branch } from "../scrape-multithreaded/branch-record-object/Branch";

const router = express.Router();

router.get("/api/scrape/testing", async (req: Request, res: Response, next: NextFunction) => {
	const responses: any[] = [];
	try {
		const workerPath = path.join(__dirname, "..", "scrape-multithreaded", "WorkerNew.js");

		const elasticClient = new ElasticClient();

		// const isErrorIndexCreated = await elasticClient.createErrorsIndex();

		const allBranches = (await elasticClient.getAllBranchIndexRecords()) ?? [];
		const branch = allBranches[0];
		const { qnomycode } = branch._source;

		console.log(`[Elastic] Branch query result amount: ${allBranches.length}`);

		const proxyObj = {
			proxyPassword: "",
			proxyUrl: "",
			proxyUsername: "",
			timeout: 10000,
			useProxy: false,
		};

		const testBranch = new Branch(branch._source, proxyObj);
		const updateReport = await testBranch.updateBranchServices();

		res.status(200).send({
			branch: branch._id,
			branchUpdateReport: updateReport,
			elasticErrors: elasticClient.getLatestError(),
			elasticNotes: elasticClient.getAllFailReasons(),
		});
	} catch (error) {
		console.log(error);
		next(error as Error);
	}
});

export { router as TestLab };
