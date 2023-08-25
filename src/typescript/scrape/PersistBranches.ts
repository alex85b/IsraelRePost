import { ElasticClient } from "../elastic/elstClient";

import { IDocumentBranch } from "../interfaces/IDocumentBranch";
// import dotenv from 'dotenv';

export const persistBranches = async (persistConfig: {
	doResetBranches: boolean;
	filteredBranches: IDocumentBranch[];
	certificateContents: string;
}) => {
	const { certificateContents, doResetBranches, filteredBranches } = persistConfig;
	const elasticClient = new ElasticClient({
		caCertificate: certificateContents,
		password: process.env.ELS_PSS || "",
		rejectUnauthorized: false,
		username: "elastic",
		node: "https://127.0.0.1:9200",
	});

	elasticClient.sendPing();

	if (doResetBranches) {
		await elasticClient.deleteBranchesIndex();
		console.log("[persistBranches] deleteBranchesIndex() : Done");
	}

	await elasticClient.createBranchesIndex();

	const branches = await elasticClient.bulkAddBranches(filteredBranches);

	if (!branches.success) {
		if (branches.error) throw branches.error;
		console.error("[persistBranches] Failed:");
		console.error("Reason: ", branches.reason);
		branches.failed.forEach((fail) => {
			console.log(fail);
		});
	}

	console.log("[persistBranches] Done : Done");
	return { persistResponse: branches.response?.items ?? [] };
};
