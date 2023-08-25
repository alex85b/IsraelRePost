import { ElasticClient } from "../elastic/elstClient";
import * as path from "path";
import fs from "fs";
import { ElasticMalfunctionError } from "../errors/elst-malfunction-error";
import { SearchResponseBody, SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";
import { NotProvided } from "../errors/NotProvided";
import { IBranchQueryResponse } from "../interfaces/IBranchQueryResponse";

export const queryAllBranches = async (certificateContents: string) => {
	//Calculate path to certificates.
	// const certificatePath = path.join(
	// 	__dirname,
	// 	'..',
	// 	'..',
	// 	'elastic-cert',
	// 	'http_ca.crt'
	// );

	// const certificateContents = fs.readFileSync(certificatePath, 'utf8');
	// console.log('[queryAllBranches] Fetch certificates : Done');

	// Create a client.
	const elasticClient = new ElasticClient({
		caCertificate: certificateContents,
		password: process.env.ELS_PSS || "",
		rejectUnauthorized: false,
		username: "elastic",
		node: "https://127.0.0.1:9200",
	});

	elasticClient.sendPing();
	console.log("[queryAllBranches] Elastic is up and running");

	if (!(await elasticClient.branchIndexExists()))
		throw new ElasticMalfunctionError("all-post-branches index does not exist");

	const branches = await elasticClient.getAllBranchIndexRecords();
	if (!branches.success) {
		console.error("[persistBranches] Failed:");
		console.error("Reason: ", branches.reason);
		if (branches.error) throw branches.error;
	}

	console.log("[queryAllBranches] search all branches : Done");

	if (!branches.response)
		throw new NotProvided({
			message: "query provided no response",
			source: "getAllBranches",
		});
	const results = branches.response.hits.hits as IBranchQueryResponse;
	return { allBranches: results };
};
