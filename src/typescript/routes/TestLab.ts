import express, { Request, Response, NextFunction } from "express";
import { UserRequest } from "../api-requests/UserRequest";
import { ServicesRequest } from "../api-requests/ServicesRequest";
import { queryAllBranches } from "../scrape/QueryAllBranches";
import path from "path";
import { readCertificates } from "../common/ReadCertificates";
import { DatesRequest } from "../api-requests/DatesRequest";
import { TimesRequest } from "../api-requests/TimesRequest";
import { persistBranches } from "../scrape/PersistBranches";
import { IDocumentBranch, INewServiceRecord } from "../interfaces/IDocumentBranch";
import { data } from "cheerio/lib/api/attributes";
import { UserNode } from "../scrape-multithreaded/requests-as-nodes/UserNode";
import { Branch } from "../scrape-multithreaded/branch-record-object/Branch";

const router = express.Router();

router.get("/api/scrape/testing", async (req: Request, res: Response, next: NextFunction) => {
	const responses: any[] = [];
	try {
		const workerPath = path.join(__dirname, "..", "scrape-multithreaded", "WorkerNew.js");

		// Read the Certificates file.
		const certificateContents = readCertificates();

		// Query Elasticsearch to get all the branches.
		const { allBranches } = await queryAllBranches(certificateContents);
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

		const newServices: INewServiceRecord[] = [];

		const testBranch = new Branch(branch._source, proxyObj);
		const qwe = await testBranch.updateBranchObject();

		// const userNode = new UserNode(proxyObj, branch._source.qnomycode, newServices);
		// const serviceNodes = await userNode.getChildren();
		// responses.push(userNode.getResponse());
		// if (serviceNodes) {
		// 	const datesNodes = await serviceNodes[0].getChildren();
		// 	responses.push(serviceNodes[0].getResponse());
		// 	if (datesNodes) {
		// 		const timesNode = await datesNodes[0].getChildren();
		// 		responses.push(datesNodes[0].getResponse());
		// 		if (timesNode) {
		// 			await timesNode[0].getChildren();
		// 			responses.push(timesNode[0].getRequestError());
		// 			responses.push(timesNode[0].getResponse());
		// 		}
		// 	}
		// }
		res.status(200).send(qwe);
	} catch (error) {
		console.log(error);
		next(error as Error);
	}
});

export { router as TestLab };
